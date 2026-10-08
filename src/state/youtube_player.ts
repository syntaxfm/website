import type { Show } from '@prisma/client';
import { get, writable } from 'svelte/store';
import { get_youtube_id } from '$utilities/youtube';
import { get_saved_position, record_duration, save_position } from './media_timeline';

// The subset of <youtube-video> (youtube-video-element) we rely on
export interface YoutubeVideoElementLike extends HTMLElement {
	src: string | null;
	currentTime: number;
	duration: number;
	paused: boolean;
	isLoaded?: boolean;
	loadComplete?: Promise<void>;
	play: () => Promise<void>;
	pause: () => Promise<void> | void;
}

interface EmbedEntry {
	show_number: number;
	video_el: YoutubeVideoElementLike;
	container_el: HTMLElement;
	is_show_page: boolean;
}

export interface YoutubePlayerState {
	active_show: Show | null;
	status: 'IDLE' | 'PLAYING' | 'PAUSED';
	// Snapshot of the playback position, taken whenever playback moves between elements
	current_time: number;
	// The <youtube-video> currently playing (inline embed or mini-player)
	active_element: YoutubeVideoElementLike | null;
	// The inline embed playback started from, which it docks back into when scrolled into view
	origin_element: YoutubeVideoElementLike | null;
	in_mini_player: boolean;
	is_minimized: boolean;
	is_dismissed: boolean;
	is_navigating: boolean;
}

// Pop out to the mini-player as soon as the embed is a few pixels out of the viewport
const VIEWPORT_TOLERANCE = 4;
const TICK_INTERVAL = 250;

function element_time(el: YoutubeVideoElementLike | null | undefined): number | null {
	if (!el) return null;
	const time = el.currentTime;
	return Number.isFinite(time) && time > 0 ? time : null;
}

function live_time(state: YoutubePlayerState) {
	return element_time(state.active_element) ?? state.current_time;
}

function safe_pause(el: YoutubeVideoElementLike | null | undefined) {
	if (!el) return;
	try {
		void Promise.resolve(el.pause()).catch(() => {});
	} catch {
		// The YouTube API throws if the iframe has gone away, nothing to pause
	}
}

async function seek_and_play(el: YoutubeVideoElementLike, time: number, should_play: boolean) {
	try {
		if (el.loadComplete) await el.loadComplete;
		if (time > 0 && Math.abs((el.currentTime || 0) - time) > 1) {
			el.currentTime = time;
		}
		if (should_play) await el.play();
	} catch {
		// Autoplay can be blocked by the browser, the user can still hit play
	}
}

function is_container_in_view(container: HTMLElement): boolean {
	if (!container.isConnected) return false;
	const rect = container.getBoundingClientRect();
	// Zero size means it's hidden, so it can't be in view
	if (rect.width === 0 && rect.height === 0) return false;
	const viewport_height =
		typeof window !== 'undefined'
			? window.innerHeight || document.documentElement.clientHeight
			: Infinity;
	return rect.top >= -VIEWPORT_TOLERANCE && rect.bottom <= viewport_height + VIEWPORT_TOLERANCE;
}

function create_youtube_player() {
	const initial_state: YoutubePlayerState = {
		active_show: null,
		status: 'IDLE',
		current_time: 0,
		active_element: null,
		origin_element: null,
		in_mini_player: false,
		is_minimized: false,
		is_dismissed: false,
		is_navigating: false
	};

	const store = writable<YoutubePlayerState>(initial_state);
	const { subscribe, update } = store;

	const embeds = new Map<YoutubeVideoElementLike, EmbedEntry>();
	let observer: IntersectionObserver | null = null;
	let ticker: ReturnType<typeof setInterval> | null = null;

	// TICKER
	// One interval for the playing element only. Saves position (throttled) and keeps
	// media-chrome's bottom bar in sync, as the YouTube iframe doesn't reliably fire timeupdate.
	function tick() {
		const { active_show, active_element } = get(store);
		if (!active_show || !active_element) return;
		record_duration(active_show.number, 'VIDEO', active_element.duration);
		const time = element_time(active_element);
		if (time === null) return;
		save_position(active_show.number, 'VIDEO', time);
		active_element.dispatchEvent(new Event('timeupdate'));
	}

	subscribe((state) => {
		const should_tick = state.status === 'PLAYING' && Boolean(state.active_element);
		if (should_tick && !ticker) {
			ticker = setInterval(tick, TICK_INTERVAL);
		} else if (!should_tick && ticker) {
			clearInterval(ticker);
			ticker = null;
		}
	});

	function save_now(state: YoutubePlayerState) {
		if (state.active_show) {
			save_position(state.active_show.number, 'VIDEO', live_time(state), true);
		}
	}

	// VISIBILITY
	function get_observer() {
		if (!observer && typeof IntersectionObserver !== 'undefined') {
			observer = new IntersectionObserver(on_intersect, {
				// Intermediate thresholds so an embed that's already partly out of view still pops out on scroll
				threshold: [0, 0.25, 0.5, 0.75, 1],
				rootMargin: `${VIEWPORT_TOLERANCE}px 0px`
			});
		}
		return observer;
	}

	function on_intersect(entries: IntersectionObserverEntry[]) {
		for (const entry of entries) {
			const embed = [...embeds.values()].find((e) => e.container_el === entry.target);
			if (!embed) continue;
			// Rounding can leave a fully visible element at 0.99something
			const in_view = entry.isIntersecting && entry.intersectionRatio >= 0.99;
			set_embed_visibility(embed.video_el, in_view);
		}
	}

	/**
	 * Scrolling a playing embed out of view pops it out to the mini-player.
	 * Scrolling back only docks into the show page embed. On list pages the mini-player
	 * keeps playing until the user plays the card directly.
	 */
	function set_embed_visibility(video_el: YoutubeVideoElementLike, in_view: boolean) {
		const embed = embeds.get(video_el);
		if (!embed) return;
		if (!in_view) {
			enter_mini_player_from_scroll(embed.show_number, video_el);
		} else if (embed.is_show_page) {
			dock_to_inline(embed.show_number, video_el);
		}
	}

	function active_show_is(state: YoutubePlayerState, show_number: number) {
		return state.active_show?.number === show_number;
	}

	/**
	 * Registers an inline <YoutubeEmbed>. Returns a cleanup function to call on unmount.
	 */
	function register_embed(entry: EmbedEntry) {
		embeds.set(entry.video_el, entry);
		get_observer()?.observe(entry.container_el);

		// The show page embed takes over playback of its episode (from a card or the mini-player)
		if (entry.is_show_page && active_show_is(get(store), entry.show_number)) {
			dock_to_inline(entry.show_number, entry.video_el, true);
		}

		return () => unregister_embed(entry);
	}

	function unregister_embed({ show_number, video_el, container_el }: EmbedEntry) {
		observer?.unobserve(container_el);
		embeds.delete(video_el);

		const state = get(store);
		if (!active_show_is(state, show_number)) return;
		const was_active = state.active_element === video_el;
		if (!was_active && state.origin_element !== video_el) return;

		const time = was_active ? (element_time(video_el) ?? state.current_time) : state.current_time;
		if (was_active) save_position(show_number, 'VIDEO', time, true);

		update((s) => ({
			...s,
			current_time: time,
			active_element: was_active ? null : s.active_element,
			origin_element: s.origin_element === video_el ? null : s.origin_element,
			// Keep playing in the mini-player when a playing embed goes away (navigation)
			in_mini_player: s.in_mini_player || (was_active && s.status === 'PLAYING')
		}));
	}

	// The embed a show should play in: the show page's if mounted, otherwise the latest mounted card
	function find_embed_entry(show_number: number) {
		const candidates = [...embeds.values()].filter(
			(e) => e.show_number === show_number && e.video_el.isConnected
		);
		return candidates.find((e) => e.is_show_page) ?? candidates.at(-1) ?? null;
	}

	function find_embed(show_number: number) {
		return find_embed_entry(show_number)?.video_el ?? null;
	}

	/**
	 * Starts or resumes a show's video from the "Play" buttons.
	 * Plays in the mounted inline embed if it's in view, otherwise in the mini-player.
	 * `play_from_position` is on the video's timeline.
	 */
	async function start_show(show: Show, play_from_position?: number) {
		if (!get_youtube_id(show.youtube_url)) return false;

		const current = get(store);
		const is_same_show = active_show_is(current, show.number);
		const resume_time =
			play_from_position ??
			(is_same_show ? live_time(current) : get_saved_position(show.number, 'VIDEO'));

		const target = find_embed_entry(show.number);
		const play_inline = target ? is_container_in_view(target.container_el) : false;

		const previous = current.active_element;
		const reuse_mini =
			!play_inline && is_same_show && current.in_mini_player && previous?.isConnected
				? previous
				: null;
		const next_element = play_inline && target ? target.video_el : reuse_mini;

		if (previous && previous !== next_element) {
			save_now(current);
			safe_pause(previous);
		}

		update((s) => ({
			...s,
			active_show: show,
			status: 'PLAYING',
			current_time: resume_time,
			active_element: next_element,
			origin_element: target?.video_el ?? null,
			in_mini_player: !play_inline,
			is_minimized: !play_inline && is_same_show ? s.is_minimized : false,
			is_dismissed: false
		}));

		// Otherwise the mini-player mounts and picks up playback in attach_mini_player
		if (next_element) {
			await seek_and_play(next_element, resume_time, true);
		}
		return true;
	}

	/**
	 * Called when an inline <YoutubeEmbed> starts playing from its own controls.
	 */
	function set_playing(show: Show, element: YoutubeVideoElementLike) {
		if (!get_youtube_id(show.youtube_url)) return;

		const current = get(store);
		const is_same_show = active_show_is(current, show.number);

		if (is_same_show && current.active_element === element && !current.in_mini_player) {
			if (current.status !== 'PLAYING') {
				update((s) => ({ ...s, status: 'PLAYING', is_dismissed: false }));
			}
			return;
		}

		let resume_time: number;
		if (is_same_show) {
			// Same episode playing elsewhere (mini-player or another card), continue from there
			resume_time = live_time(current);
		} else {
			resume_time = element_time(element) ?? get_saved_position(show.number, 'VIDEO');
		}
		if (resume_time > 0 && Math.abs((element.currentTime || 0) - resume_time) > 1) {
			element.currentTime = resume_time;
		}

		if (current.active_element && current.active_element !== element) {
			save_now(current);
			safe_pause(current.active_element);
		}

		update((s) => ({
			...s,
			active_show: show,
			status: 'PLAYING',
			current_time: resume_time,
			active_element: element,
			origin_element: element,
			in_mini_player: false,
			is_minimized: false,
			is_dismissed: false
		}));
	}

	/**
	 * The mini-player's <youtube-video> mounted (or switched shows). Picks up playback where it left off.
	 */
	function attach_mini_player(element: YoutubeVideoElementLike) {
		const state = get(store);
		update((s) => ({ ...s, active_element: element }));
		void seek_and_play(element, state.current_time, state.status === 'PLAYING');
	}

	/**
	 * The mini-player's <youtube-video> is unmounting, snapshot its position.
	 */
	function detach_mini_player(element: YoutubeVideoElementLike) {
		const state = get(store);
		if (state.active_element !== element) return;
		save_now(state);
		update((s) => ({ ...s, current_time: live_time(s), active_element: null }));
	}

	/**
	 * Called when the mini-player starts playing from its own controls.
	 */
	function set_mini_player_playing(element: YoutubeVideoElementLike) {
		update((s) => ({
			...s,
			status: 'PLAYING',
			active_element: element,
			in_mini_player: true,
			is_dismissed: false
		}));
	}

	function enter_mini_player_from_scroll(show_number: number, inline_el: YoutubeVideoElementLike) {
		const state = get(store);
		if (state.is_navigating || state.in_mini_player || state.status !== 'PLAYING') return;
		if (!active_show_is(state, show_number) || state.origin_element !== inline_el) return;

		update((s) => ({
			...s,
			current_time: element_time(inline_el) ?? s.current_time,
			active_element: null,
			in_mini_player: true,
			is_dismissed: false
		}));
		safe_pause(inline_el);
	}

	/**
	 * Moves playback back into an inline embed. Only the embed playback came from can reclaim it,
	 * unless `force_claim` is set (the show page embed for the playing episode).
	 */
	function dock_to_inline(
		show_number: number,
		inline_el: YoutubeVideoElementLike,
		force_claim = false
	) {
		const state = get(store);
		if (!active_show_is(state, show_number)) return;
		if (!force_claim && (!state.in_mini_player || state.origin_element !== inline_el)) return;
		if (state.active_element === inline_el && !state.in_mini_player) return;

		// Dismissed mini-player: remember where to dock but don't take over playback
		if (state.is_dismissed) {
			update((s) => ({ ...s, origin_element: inline_el }));
			return;
		}

		const previous = state.active_element;
		const resume_time = live_time(state);

		update((s) => ({
			...s,
			current_time: resume_time,
			active_element: inline_el,
			origin_element: inline_el,
			in_mini_player: false
		}));

		if (previous && previous !== inline_el) safe_pause(previous);
		void seek_and_play(inline_el, resume_time, state.status === 'PLAYING');
	}

	function set_paused(show_number: number, element: YoutubeVideoElementLike) {
		const state = get(store);
		if (state.is_navigating || !active_show_is(state, show_number)) return;
		// Ignore pauses from elements we've moved playback away from
		if (!element.isConnected || state.active_element !== element) return;

		const time = element_time(element) ?? state.current_time;
		save_position(show_number, 'VIDEO', time, true);
		update((s) => ({ ...s, status: 'PAUSED', current_time: time }));
	}

	async function play() {
		const state = get(store);
		if (!state.active_show) return;
		// Nowhere to play (navigated away while paused), find an embed or open the mini-player
		if (!state.active_element) {
			await start_show(state.active_show, state.current_time);
			return;
		}
		update((s) => ({ ...s, status: 'PLAYING', is_dismissed: false }));
		await seek_and_play(state.active_element, state.current_time, true);
	}

	function pause() {
		const state = get(store);
		if (!state.active_show) return;
		save_now(state);
		update((s) => ({ ...s, status: 'PAUSED', current_time: live_time(state) }));
		safe_pause(state.active_element);
	}

	async function seek(show: Show, seconds: number) {
		const state = get(store);
		if (active_show_is(state, show.number) && state.active_element) {
			update((s) => ({ ...s, current_time: seconds, status: 'PLAYING', is_dismissed: false }));
			await seek_and_play(state.active_element, seconds, true);
		} else {
			await start_show(show, seconds);
		}
	}

	function toggle_minimize() {
		update((s) => ({ ...s, is_minimized: !s.is_minimized, is_dismissed: false }));
	}

	/**
	 * Hides the mini-player and pauses, but keeps the element mounted
	 * so the bottom player bar can resume it.
	 */
	function dismiss_mini_player() {
		const state = get(store);
		if (!state.active_show) return;
		save_now(state);
		update((s) => ({
			...s,
			status: 'PAUSED',
			current_time: live_time(state),
			in_mini_player: true,
			is_minimized: true,
			is_dismissed: true
		}));
		safe_pause(state.active_element);
	}

	function close() {
		const state = get(store);
		save_now(state);
		update(() => ({ ...initial_state }));
		safe_pause(state.active_element);
	}

	function before_navigate() {
		const state = get(store);
		save_now(state);
		update((s) => ({ ...s, current_time: live_time(s), is_navigating: true }));
	}

	function after_navigate() {
		update((s) => {
			// The playing element went away with the old page, keep going in the mini-player
			const lost_element = s.status === 'PLAYING' && !s.active_element?.isConnected;
			return {
				...s,
				is_navigating: false,
				in_mini_player: s.in_mini_player || (Boolean(s.active_show) && lost_element)
			};
		});
	}

	function get_current_time() {
		return live_time(get(store));
	}

	return {
		subscribe,
		register_embed,
		find_embed,
		set_embed_visibility,
		start_show,
		set_playing,
		attach_mini_player,
		detach_mini_player,
		set_mini_player_playing,
		enter_mini_player_from_scroll,
		dock_to_inline,
		set_paused,
		play,
		pause,
		seek,
		toggle_minimize,
		dismiss_mini_player,
		close,
		before_navigate,
		after_navigate,
		get_current_time
	};
}

export const youtube_player = create_youtube_player();
