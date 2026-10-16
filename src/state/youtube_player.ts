import type { Show } from '@prisma/client';
import { get, writable } from 'svelte/store';
import { get_youtube_id } from '$utilities/youtube';
import { get_saved_position, record_duration, save_position } from './media_timeline';

// The subset of the YouTube IFrame API player we call directly
interface YoutubeIframeApi {
	loadVideoById: (options: { videoId: string; startSeconds?: number }) => void;
}

// The subset of <youtube-video> (youtube-video-element) we rely on
export interface YoutubeVideoElementLike extends HTMLElement {
	src: string | null;
	currentTime: number;
	duration: number;
	paused: boolean;
	isLoaded?: boolean;
	loadComplete?: Promise<void>;
	api?: YoutubeIframeApi | null;
	play: () => Promise<void>;
	pause: () => Promise<void> | void;
}

interface SlotEntry {
	show_number: number;
	slot_el: HTMLElement;
	is_show_page: boolean;
}

export type YoutubeTarget = 'SLOT' | 'DOCK';

export interface YoutubePlayerState {
	// The episode loaded in the global player
	active_show: Show | null;
	status: 'IDLE' | 'PLAYING' | 'PAUSED';
	// Last known playback position, for when the element can't be asked
	current_time: number;
	// The video the global <youtube-video> shows. Changing it switches videos in the same iframe.
	video_id: string | null;
	start_seconds: number;
	// The single global <youtube-video>, once mounted
	active_element: YoutubeVideoElementLike | null;
	// The episode slot the video belongs to on the current page
	slot_el: HTMLElement | null;
	// Laid over slot_el, or docked in the bottom player bar
	target: YoutubeTarget;
	dock_el: HTMLElement | null;
}

// Dock as soon as the slot is a few pixels out of the viewport
const VIEWPORT_TOLERANCE = 4;
const TICK_INTERVAL = 250;
const SWITCHING_TIMEOUT = 10000;

function element_time(el: YoutubeVideoElementLike | null | undefined): number | null {
	if (!el) return null;
	const time = el.currentTime;
	return Number.isFinite(time) && time > 0 ? time : null;
}

function safe_pause(el: YoutubeVideoElementLike | null | undefined) {
	if (!el) return;
	try {
		void Promise.resolve(el.pause()).catch(() => {});
	} catch {
		// The YouTube API throws if the iframe has gone away, nothing to pause
	}
}

async function seek_and_play(el: YoutubeVideoElementLike, time: number) {
	try {
		if (el.loadComplete) await el.loadComplete;
		if (time > 0 && Math.abs((el.currentTime || 0) - time) > 1) {
			el.currentTime = time;
		}
		await el.play();
	} catch {
		// Autoplay can be blocked by the browser, the user can still hit play
	}
}

function create_youtube_player() {
	const initial_state: YoutubePlayerState = {
		active_show: null,
		status: 'IDLE',
		current_time: 0,
		video_id: null,
		start_seconds: 0,
		active_element: null,
		slot_el: null,
		target: 'DOCK',
		dock_el: null
	};

	const store = writable<YoutubePlayerState>(initial_state);
	const { subscribe, update } = store;

	const slots = new Map<HTMLElement, SlotEntry>();
	let observer: IntersectionObserver | null = null;
	// Height of the bottom player bar, which covers the bottom of the viewport
	let bottom_inset = 0;
	let rebuild_frame: number | null = null;
	let ticker: ReturnType<typeof setInterval> | null = null;
	// After loadVideoById the element reports the previous video's duration and time until the new one plays
	let is_switching_video = false;
	let switching_timer: ReturnType<typeof setTimeout> | undefined;

	// The new video may never play (autoplay blocked, unavailable), so switching gives up after a while
	function set_switching_video(value: boolean) {
		is_switching_video = value;
		clearTimeout(switching_timer);
		if (value) {
			switching_timer = setTimeout(() => {
				is_switching_video = false;
			}, SWITCHING_TIMEOUT);
		}
	}

	// TICKER
	// Saves position (throttled) and keeps media-chrome's bottom bar in sync,
	// as the YouTube iframe doesn't reliably fire timeupdate.
	function tick() {
		const { active_show, active_element } = get(store);
		if (!active_show || !active_element || is_switching_video) return;
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

	function live_time(state: YoutubePlayerState) {
		if (is_switching_video) return state.current_time;
		return element_time(state.active_element) ?? state.current_time;
	}

	function save_now(state: YoutubePlayerState) {
		if (state.active_show) {
			save_position(state.active_show.number, 'VIDEO', live_time(state), true);
		}
	}

	function active_show_is(state: YoutubePlayerState, show_number: number) {
		return state.status !== 'IDLE' && state.active_show?.number === show_number;
	}

	function is_slot_in_view(slot_el: HTMLElement): boolean {
		if (!slot_el.isConnected) return false;
		const rect = slot_el.getBoundingClientRect();
		// Zero size means it's hidden, so it can't be in view
		if (rect.width === 0 && rect.height === 0) return false;
		const viewport_height =
			typeof window !== 'undefined'
				? window.innerHeight || document.documentElement.clientHeight
				: Infinity;
		return (
			rect.top >= -VIEWPORT_TOLERANCE &&
			rect.bottom <= viewport_height - bottom_inset + VIEWPORT_TOLERANCE
		);
	}

	// VISIBILITY
	function get_observer() {
		if (!observer && typeof IntersectionObserver !== 'undefined') {
			observer = new IntersectionObserver(on_intersect, {
				// Intermediate thresholds so a slot that's already partly out of view still docks on scroll
				threshold: [0, 0.25, 0.5, 0.75, 1],
				// The bottom player bar covers the bottom of the viewport
				rootMargin: `${VIEWPORT_TOLERANCE}px 0px ${VIEWPORT_TOLERANCE - bottom_inset}px`
			});
			for (const slot_el of slots.keys()) observer.observe(slot_el);
		}
		return observer;
	}

	function on_intersect(entries: IntersectionObserverEntry[]) {
		for (const entry of entries) {
			if (!(entry.target instanceof HTMLElement)) continue;
			// Rounding can leave a fully visible element at 0.99something
			set_slot_visibility(entry.target, entry.isIntersecting && entry.intersectionRatio >= 0.99);
		}
	}

	function rebuild_observer() {
		rebuild_frame = null;
		observer?.disconnect();
		observer = null;
		if (slots.size) get_observer();
	}

	/**
	 * The bottom bar changed height. Rebuilds the observer, as rootMargin can't be changed.
	 * Changes within a frame (the bar relaying out) share one rebuild.
	 */
	function set_bottom_inset(height: number) {
		if (height === bottom_inset) return;
		bottom_inset = height;
		if (typeof requestAnimationFrame === 'undefined') return rebuild_observer();
		if (rebuild_frame === null) rebuild_frame = requestAnimationFrame(rebuild_observer);
	}

	/**
	 * Scrolling the video's slot out of view docks it in the player bar.
	 * It stays docked until a card is played, scrolling back doesn't bring it back.
	 */
	function set_slot_visibility(slot_el: HTMLElement, in_view: boolean) {
		const state = get(store);
		if (in_view || state.status === 'IDLE' || state.slot_el !== slot_el) return;
		if (state.target !== 'DOCK') update((s) => ({ ...s, target: 'DOCK' }));
	}

	// SLOTS
	/**
	 * Registers an episode's <YoutubeEmbed> slot. Returns a cleanup function to call on unmount.
	 */
	function register_slot(entry: SlotEntry) {
		slots.set(entry.slot_el, entry);
		get_observer()?.observe(entry.slot_el);
		return () => unregister_slot(entry.slot_el);
	}

	function unregister_slot(slot_el: HTMLElement) {
		observer?.unobserve(slot_el);
		slots.delete(slot_el);
		// The page the video was on went away, keep it going in the dock
		if (get(store).slot_el === slot_el) {
			update((s) => ({ ...s, slot_el: null, target: 'DOCK' }));
		}
	}

	/**
	 * Registers the bottom player bar's video dock. Returns a cleanup function to call on unmount.
	 */
	function register_dock(dock_el: HTMLElement) {
		update((s) => ({ ...s, dock_el }));
		return () => update((s) => (s.dock_el === dock_el ? { ...s, dock_el: null } : s));
	}

	function is_show_page_slot(slot_el: HTMLElement | null) {
		return Boolean(slot_el && slots.get(slot_el)?.is_show_page);
	}

	/**
	 * Moves a playing video from its slot into the bottom player bar.
	 * It comes back the same way as after scrolling away, from the slot's restore button.
	 */
	function dock() {
		update((s) => (s.status === 'IDLE' ? s : { ...s, target: 'DOCK' }));
	}

	// The slot a show plays over: the show page's if mounted, otherwise the latest mounted card
	function find_slot(show_number: number) {
		const candidates = [...slots.values()].filter(
			(e) => e.show_number === show_number && e.slot_el.isConnected
		);
		return candidates.find((e) => e.is_show_page) ?? candidates.at(-1) ?? null;
	}

	// ELEMENT
	/**
	 * The global <youtube-video> mounted. Starts playback if play was requested before it existed.
	 * Returns a cleanup function to call on unmount.
	 */
	function register_element(element: YoutubeVideoElementLike) {
		set_switching_video(false);
		update((s) => ({ ...s, active_element: element }));
		const state = get(store);
		if (state.status === 'PLAYING') void seek_and_play(element, state.start_seconds);

		return () => {
			const current = get(store);
			if (current.active_element !== element) return;
			save_now(current);
			update((s) => ({ ...s, current_time: live_time(s), active_element: null }));
		};
	}

	/**
	 * A <youtube-video> showing this show, to read the video duration from.
	 * The global element once it's playing the show, otherwise the preview in one of the show's slots.
	 */
	function find_video(show: Show): YoutubeVideoElementLike | null {
		const state = get(store);
		if (!is_switching_video && state.video_id === get_youtube_id(show.youtube_url)) {
			return state.active_element;
		}
		const preview = find_slot(show.number)?.slot_el.querySelector?.('youtube-video');
		return (preview as YoutubeVideoElementLike | null | undefined) ?? null;
	}

	/**
	 * Warms up the global player before the first play, so the click doesn't wait on the iframe and YouTube API.
	 */
	function prewarm(show: Show) {
		const video_id = get_youtube_id(show.youtube_url);
		if (!video_id || get(store).video_id) return;
		update((s) => ({ ...s, video_id, start_seconds: get_saved_position(show.number, 'VIDEO') }));
	}

	/**
	 * Plays a show in the global element from `start` seconds on the video timeline.
	 * Switching shows changes video_id, which the element's wrapper loads in place with loadVideoById.
	 */
	async function load(
		show: Show,
		video_id: string,
		start: number,
		placement: Partial<YoutubePlayerState>
	) {
		const state = get(store);
		const element = state.active_element;
		const is_loaded = Boolean(element) && state.video_id === video_id;

		if (state.status !== 'IDLE' && state.active_show?.number !== show.number) save_now(state);
		if (element && !is_loaded) set_switching_video(true);

		update((s) => ({
			...s,
			...placement,
			active_show: show,
			status: 'PLAYING',
			current_time: start,
			video_id,
			start_seconds: start
		}));

		// Otherwise the wrapper switches videos, or register_element starts the first one
		if (element && is_loaded) await seek_and_play(element, start);
	}

	/**
	 * Plays a show over one of its slots, from a click on that slot.
	 */
	async function play_in_slot(show: Show, slot_el: HTMLElement) {
		const video_id = get_youtube_id(show.youtube_url);
		if (!video_id) return false;
		const state = get(store);
		const start = active_show_is(state, show.number)
			? live_time(state)
			: get_saved_position(show.number, 'VIDEO');
		await load(show, video_id, start, { slot_el, target: 'SLOT' });
		return true;
	}

	/**
	 * Takes a show's video out of the dock, scrolls to its slot on the show page and plays it there.
	 * Call once the show page is mounted, so its slot is registered.
	 */
	async function play_on_show_page(show: Show) {
		const slot = find_slot(show.number);
		if (!slot) return false;
		// Instant, so the slot is in view before it's targeted and doesn't dock again mid-scroll
		slot.slot_el.scrollIntoView({ block: 'center', behavior: 'instant' });
		return play_in_slot(show, slot.slot_el);
	}

	/**
	 * Starts or resumes a show's video from outside its slot (play buttons, timestamps, the bottom bar).
	 * Plays over the show's slot if it's in view, otherwise in the dock.
	 * A docked video stays docked when jumping to a timestamp, only playing a card brings it back.
	 * `play_from_position` is on the video's timeline.
	 */
	async function start_show(show: Show, play_from_position?: number) {
		const video_id = get_youtube_id(show.youtube_url);
		if (!video_id) return false;
		const state = get(store);
		const start =
			play_from_position ??
			(active_show_is(state, show.number)
				? live_time(state)
				: get_saved_position(show.number, 'VIDEO'));
		const stays_docked =
			play_from_position != null && active_show_is(state, show.number) && state.target === 'DOCK';
		const slot = stays_docked ? null : find_slot(show.number);
		await load(
			show,
			video_id,
			start,
			stays_docked
				? {}
				: {
						slot_el: slot?.slot_el ?? null,
						target: slot && is_slot_in_view(slot.slot_el) ? 'SLOT' : 'DOCK'
					}
		);
		return true;
	}

	// EVENTS FROM THE ELEMENT
	function on_element_play() {
		const state = get(store);
		if (state.active_show && state.status !== 'PLAYING') {
			update((s) => ({ ...s, status: 'PLAYING' }));
		}
	}

	function on_element_playing() {
		if (!is_switching_video) return;
		// The new video is playing, so its duration is real now. The element only fires durationchange on first load.
		set_switching_video(false);
		get(store).active_element?.dispatchEvent(new Event('durationchange'));
	}

	function on_element_pause() {
		const state = get(store);
		if (!state.active_show || state.status === 'IDLE' || is_switching_video) return;
		const time = live_time(state);
		save_position(state.active_show.number, 'VIDEO', time, true);
		update((s) => ({ ...s, status: 'PAUSED', current_time: time }));
	}

	// CONTROLS
	async function play() {
		const state = get(store);
		if (!state.active_show) return;
		if (!state.active_element) {
			await start_show(state.active_show, state.current_time);
			return;
		}
		update((s) => ({
			...s,
			status: 'PLAYING',
			target: s.slot_el && is_slot_in_view(s.slot_el) ? s.target : 'DOCK'
		}));
		await seek_and_play(state.active_element, 0);
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
		if (active_show_is(state, show.number) && state.active_element && !is_switching_video) {
			update((s) => ({ ...s, current_time: seconds, status: 'PLAYING' }));
			await seek_and_play(state.active_element, seconds);
		} else {
			await start_show(show, seconds);
		}
	}

	/**
	 * Stops the video. The global element unmounts with video_id cleared.
	 */
	function close() {
		const state = get(store);
		save_now(state);
		safe_pause(state.active_element);
		set_switching_video(false);
		update((s) => ({ ...initial_state, dock_el: s.dock_el }));
	}

	function before_navigate() {
		const state = get(store);
		save_now(state);
		update((s) => ({ ...s, current_time: live_time(s) }));
	}

	function get_current_time() {
		return live_time(get(store));
	}

	return {
		subscribe,
		register_slot,
		register_dock,
		is_show_page_slot,
		dock,
		register_element,
		set_bottom_inset,
		set_slot_visibility,
		find_video,
		prewarm,
		play_in_slot,
		play_on_show_page,
		start_show,
		on_element_play,
		on_element_playing,
		on_element_pause,
		play,
		pause,
		seek,
		close,
		before_navigate,
		get_current_time
	};
}

export const youtube_player = create_youtube_player();
