import { get, writable } from 'svelte/store';
import { get_youtube_id } from '$utilities/youtube';

export interface YoutubeShowInfo {
	number: number;
	title: string;
	slug: string;
	youtube_url: string;
	video_id: string;
	raw_show?: any;
}

export interface YoutubeVideoElementLike extends HTMLElement {
	src: string | null;
	currentTime: number;
	duration: number;
	paused: boolean;
	autoplay: boolean;
	config?: Record<string, unknown> | null;
	isLoaded?: boolean;
	loadComplete?: Promise<void>;
	play: () => Promise<void>;
	pause: () => Promise<void>;
}

interface MountedEmbedEntry {
	video_el: YoutubeVideoElementLike;
	container_el: HTMLElement;
	is_show_page: boolean;
}

export interface YoutubePlayerState {
	active_show: YoutubeShowInfo | null;
	status: 'IDLE' | 'PLAYING' | 'PAUSED';
	current_time: number;
	active_element: YoutubeVideoElementLike | null;
	origin_element: YoutubeVideoElementLike | null;
	in_mini_player: boolean;
	is_minimized: boolean;
	is_dismissed: boolean;
	show_page_number: number | null;
	is_navigating: boolean;
}

function is_container_in_view(container: HTMLElement): boolean {
	if (!container.isConnected) return false;
	const rect = container.getBoundingClientRect();
	const viewport_height =
		typeof window !== 'undefined'
			? window.innerHeight || document.documentElement.clientHeight
			: 800;
	if (rect.width === 0 && rect.height === 0) return true;
	return rect.top >= -4 && rect.bottom <= viewport_height + 4;
}

function get_saved_position(show_number: number): number {
	if (typeof localStorage === 'undefined') return 0;
	const saved = localStorage.getItem(`last_played_position_${show_number}`);
	if (!saved) return 0;
	const parsed = parseFloat(saved);
	return !Number.isNaN(parsed) && parsed > 0 ? parsed : 0;
}

async function seek_and_play(
	el: YoutubeVideoElementLike,
	resume_time: number,
	should_play: boolean
) {
	try {
		if (el.loadComplete) {
			await el.loadComplete;
		}
		if (resume_time > 0 && Math.abs((el.currentTime || 0) - resume_time) > 1) {
			el.currentTime = resume_time;
		}
		if (should_play) {
			await el.play();
		}
	} catch {
		// ignore play promise rejections
	}
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
		show_page_number: null,
		is_navigating: false
	};

	const store = writable<YoutubePlayerState>(initial_state);
	const { subscribe, update, set } = store;

	const mounted_embeds = new Map<number, MountedEmbedEntry[]>();

	let pause_audio_cb: (() => void) | null = null;
	let sync_player_cb:
		| ((info: {
				show: any;
				status: 'PLAYING' | 'PAUSED' | 'IDLE';
				element: YoutubeVideoElementLike | null;
				current_time: number;
		  }) => void)
		| null = null;

	function notify_player_sync() {
		if (!sync_player_cb) return;
		const state = get(store);
		sync_player_cb({
			show: state.active_show?.raw_show ?? state.active_show,
			status: state.status,
			element: state.active_element,
			current_time: state.current_time
		});
	}

	return {
		subscribe,
		set,
		update,

		on_play_pause_audio(cb: () => void) {
			pause_audio_cb = cb;
		},

		on_sync_player(
			cb: (info: {
				show: any;
				status: 'PLAYING' | 'PAUSED' | 'IDLE';
				element: YoutubeVideoElementLike | null;
				current_time: number;
			}) => void
		) {
			sync_player_cb = cb;
		},

		register_embed(
			show_number: number,
			video_el: YoutubeVideoElementLike,
			container_el: HTMLElement,
			is_show_page = false
		) {
			const current_list: MountedEmbedEntry[] = mounted_embeds.get(show_number) ?? [];
			const existing = current_list.filter(
				(e: MountedEmbedEntry) => e.video_el !== video_el && e.video_el.isConnected
			);
			mounted_embeds.set(show_number, [
				...existing,
				{ video_el, container_el, is_show_page }
			]);

			if (is_show_page) {
				this.register_show_page(show_number, video_el);
			}
		},

		register_show_page(show_number: number, element: YoutubeVideoElementLike) {
			update((state) => {
				const is_active = state.active_show?.number === show_number;
				return {
					...state,
					show_page_number: show_number,
					origin_element: is_active ? element : state.origin_element
				};
			});
		},

		unregister_embed(
			show_number: number,
			element: YoutubeVideoElementLike | null,
			is_show_page = false
		) {
			const current_list: MountedEmbedEntry[] = mounted_embeds.get(show_number) ?? [];
			const existing = current_list.filter(
				(e: MountedEmbedEntry) => e.video_el !== element && e.video_el.isConnected
			);
			if (existing.length > 0) {
				mounted_embeds.set(show_number, existing);
			} else {
				mounted_embeds.delete(show_number);
			}

			update((state) => {
				let next_time = state.current_time;
				if (
					element &&
					state.active_element === element &&
					typeof element.currentTime === 'number' &&
					element.currentTime > 0
				) {
					next_time = element.currentTime;
				}
				const is_current_show_page = is_show_page && state.show_page_number === show_number;
				const was_active_inline =
					state.active_show?.number === show_number &&
					(state.active_element === element || state.origin_element === element);
				const should_enter_mini = was_active_inline && state.status === 'PLAYING';

				return {
					...state,
					current_time: next_time,
					active_element: state.active_element === element ? null : state.active_element,
					origin_element: state.origin_element === element ? null : state.origin_element,
					show_page_number: is_current_show_page ? null : state.show_page_number,
					in_mini_player: should_enter_mini ? true : state.in_mini_player
				};
			});
		},

		/**
		 * Starts or resumes playing a show's YouTube video from "Play #XXXX" / "Play/Resume Episode XXXX" buttons.
		 * Plays the mounted inline embed if it is in view on the page; otherwise plays in the mini-player.
		 */
		async start_show(
			show: { number: number; title: string; slug: string; youtube_url?: string | null },
			play_from_position?: number
		) {
			const video_id = get_youtube_id(show.youtube_url);
			if (!video_id || !show.youtube_url) return false;

			if (pause_audio_cb) {
				pause_audio_cb();
			}

			const current = get(store);
			const is_same_show = current.active_show?.number === show.number;

			let resume_time =
				play_from_position != null && play_from_position > 0
					? play_from_position
					: is_same_show && current.current_time > 0
						? current.current_time
						: get_saved_position(show.number);

			const current_list: MountedEmbedEntry[] = mounted_embeds.get(show.number) ?? [];
			const entries = current_list.filter(
				(e: MountedEmbedEntry) => e.video_el.isConnected
			);
			const show_page_entry = entries.find((e: MountedEmbedEntry) => e.is_show_page);
			const target_entry = show_page_entry ?? entries.at(-1) ?? null;
			const target_in_view = target_entry
				? is_container_in_view(target_entry.container_el)
				: false;

			if (current.active_element && current.active_element !== target_entry?.video_el) {
				const prev_el = current.active_element;
				update((s) => ({ ...s, active_element: null }));
				try {
					prev_el.pause();
				} catch {
					// ignore
				}
			}

			if (target_entry && target_in_view) {
				const el = target_entry.video_el;
				update((state) => ({
					...state,
					active_show: {
						number: show.number,
						title: show.title,
						slug: show.slug,
						youtube_url: show.youtube_url!,
						video_id,
						raw_show: show
					},
					status: 'PLAYING',
					current_time: resume_time,
					active_element: el,
					origin_element: el,
					in_mini_player: false,
					is_minimized: false,
					is_dismissed: false
				}));
				notify_player_sync();
				await seek_and_play(el, resume_time, true);
			} else {
				const keep_existing_mini_el =
					is_same_show && current.in_mini_player && current.active_element?.isConnected
						? current.active_element
						: null;
				update((state) => ({
					...state,
					active_show: {
						number: show.number,
						title: show.title,
						slug: show.slug,
						youtube_url: show.youtube_url!,
						video_id,
						raw_show: show
					},
					status: 'PLAYING',
					current_time: resume_time,
					active_element: keep_existing_mini_el,
					origin_element: target_entry?.video_el ?? null,
					in_mini_player: true,
					is_minimized: is_same_show ? state.is_minimized : false,
					is_dismissed: false
				}));
				notify_player_sync();
				if (keep_existing_mini_el) {
					await seek_and_play(keep_existing_mini_el, resume_time, true);
				}
			}

			return true;
		},

		/**
		 * Called when an inline <YoutubeEmbed> starts playing directly.
		 */
		set_playing(
			show: { number: number; title: string; slug: string; youtube_url?: string | null },
			element: YoutubeVideoElementLike | null
		) {
			const video_id = get_youtube_id(show.youtube_url);
			if (!video_id || !show.youtube_url) return;

			if (pause_audio_cb) {
				pause_audio_cb();
			}

			const current = get(store);
			const is_same_show = current.active_show?.number === show.number;
			const was_in_mini_player = current.in_mini_player;

			// If this element is already the active playing element, just ensure status is PLAYING
			if (is_same_show && current.active_element === element && !was_in_mini_player) {
				if (current.status !== 'PLAYING') {
					update((state) => ({
						...state,
						status: 'PLAYING',
						is_dismissed: false
					}));
					notify_player_sync();
				}
				return;
			}

			let saved_time = is_same_show ? current.current_time : get_saved_position(show.number);
			if (
				is_same_show &&
				current.active_element &&
				current.active_element !== element &&
				typeof current.active_element.currentTime === 'number' &&
				current.active_element.currentTime > 0
			) {
				saved_time = current.active_element.currentTime;
			}

			if (current.active_element && current.active_element !== element) {
				const prev_el = current.active_element;
				update((s) => ({ ...s, active_element: element }));
				try {
					prev_el.pause();
				} catch {
					// ignore
				}
			}

			let next_time = 0;
			if (is_same_show) {
				if (was_in_mini_player && saved_time > 0) {
					next_time = saved_time;
					if (element && Math.abs((element.currentTime || 0) - saved_time) > 1) {
						element.currentTime = saved_time;
					}
				} else if (element && typeof element.currentTime === 'number' && element.currentTime > 0) {
					next_time = element.currentTime;
				} else {
					next_time = saved_time;
					if (element && saved_time > 0 && Math.abs((element.currentTime || 0) - saved_time) > 1) {
						element.currentTime = saved_time;
					}
				}
			} else if (element && typeof element.currentTime === 'number' && element.currentTime > 1) {
				next_time = element.currentTime;
			} else if (saved_time > 0) {
				next_time = saved_time;
				if (element && Math.abs((element.currentTime || 0) - saved_time) > 1) {
					element.currentTime = saved_time;
				}
			}

			update((state) => ({
				...state,
				active_show: {
					number: show.number,
					title: show.title,
					slug: show.slug,
					youtube_url: show.youtube_url!,
					video_id,
					raw_show: show
				},
				status: 'PLAYING',
				current_time: next_time,
				active_element: element,
				origin_element: element,
				in_mini_player: false,
				is_minimized: false,
				is_dismissed: false
			}));

			notify_player_sync();
		},

		set_mini_player_playing(element: YoutubeVideoElementLike | null) {
			if (pause_audio_cb) {
				pause_audio_cb();
			}
			update((state) => ({
				...state,
				status: 'PLAYING',
				active_element: element,
				in_mini_player: true,
				is_dismissed: false
			}));
			notify_player_sync();
		},

		enter_mini_player_from_scroll(show_number: number, inline_el: YoutubeVideoElementLike | null) {
			const state = get(store);
			if (state.is_navigating) return;
			if (state.active_show?.number !== show_number || state.status !== 'PLAYING') return;
			if (state.in_mini_player) return;
			if (inline_el && state.origin_element && state.origin_element !== inline_el) return;

			let next_time = state.current_time;
			if (
				inline_el &&
				typeof inline_el.currentTime === 'number' &&
				inline_el.currentTime > 0
			) {
				next_time = inline_el.currentTime;
			}

			update((s) => ({
				...s,
				current_time: next_time,
				active_element: null,
				origin_element: inline_el ?? s.origin_element,
				in_mini_player: true,
				is_dismissed: false,
				status: 'PLAYING'
			}));

			if (inline_el) {
				try {
					inline_el.pause();
				} catch {
					// ignore
				}
			}
		},

		dock_to_inline(
			show_number: number,
			inline_el: YoutubeVideoElementLike | null,
			force_claim = false
		) {
			const state = get(store);
			if (state.active_show?.number !== show_number) return;
			if (!inline_el) return;
			if (!force_claim && state.origin_element !== inline_el) return;
			if (state.is_dismissed) return;

			let resume_time = state.current_time;
			if (
				state.active_element &&
				state.active_element !== inline_el &&
				typeof state.active_element.currentTime === 'number' &&
				state.active_element.currentTime > 0
			) {
				resume_time = state.active_element.currentTime;
			}

			const was_playing = state.status === 'PLAYING';
			const prev_el = state.active_element;

			update((s) => ({
				...s,
				current_time: resume_time,
				active_element: inline_el,
				origin_element: inline_el,
				in_mini_player: false,
				is_dismissed: false
			}));

			if (prev_el && prev_el !== inline_el) {
				try {
					prev_el.pause();
				} catch {
					// ignore
				}
			}

			void seek_and_play(inline_el, resume_time, was_playing);
			notify_player_sync();
		},

		dock_to_show_page(show_number: number, show_page_el: YoutubeVideoElementLike | null) {
			this.dock_to_inline(show_number, show_page_el, true);
		},

		set_active_element(element: YoutubeVideoElementLike | null) {
			update((state) => ({
				...state,
				active_element: element
			}));
			notify_player_sync();
		},

		update_time(show_number: number, seconds: number, element?: YoutubeVideoElementLike | null) {
			if (typeof seconds !== 'number' || Number.isNaN(seconds) || seconds <= 0) return;
			update((state) => {
				if (state.active_show?.number !== show_number) return state;
				if (element && state.active_element && state.active_element !== element) return state;
				if (typeof localStorage !== 'undefined') {
					localStorage.setItem(`last_played_position_${show_number}`, seconds.toString());
				}
				return {
					...state,
					current_time: seconds
				};
			});
		},

		before_navigate() {
			update((state) => {
				let next_time = state.current_time;
				if (
					state.active_element &&
					typeof state.active_element.currentTime === 'number' &&
					state.active_element.currentTime > 0
				) {
					next_time = state.active_element.currentTime;
				}
				return {
					...state,
					current_time: next_time,
					is_navigating: true
				};
			});
		},

		after_navigate() {
			update((state) => {
				const active_num = state.active_show?.number;
				const on_matching_show_page =
					active_num != null && state.show_page_number === active_num;
				const active_el_still_connected = Boolean(state.active_element?.isConnected);
				const should_be_in_mini =
					active_num != null &&
					state.status === 'PLAYING' &&
					!on_matching_show_page &&
					!active_el_still_connected
						? true
						: state.in_mini_player;

				return {
					...state,
					is_navigating: false,
					in_mini_player: should_be_in_mini
				};
			});
		},

		set_paused(show_number: number, element?: YoutubeVideoElementLike | null) {
			let did_pause = false;
			update((state) => {
				if (state.is_navigating) return state;
				if (state.active_show?.number !== show_number) return state;
				if (element && (!element.isConnected || state.active_element !== element)) {
					return state;
				}
				const next_time =
					element && typeof element.currentTime === 'number' && element.currentTime > 0
						? element.currentTime
						: state.current_time;
				did_pause = true;
				return {
					...state,
					status: 'PAUSED',
					current_time: next_time
				};
			});
			if (did_pause) {
				notify_player_sync();
			}
		},

		async play() {
			const state = get(store);
			if (!state.active_show) return;
			if (pause_audio_cb) {
				pause_audio_cb();
			}
			update((s) => ({
				...s,
				status: 'PLAYING',
				is_dismissed: false
			}));
			if (state.active_element) {
				await seek_and_play(state.active_element, state.current_time, true);
			}
			notify_player_sync();
		},

		pause() {
			const state = get(store);
			const active_el = state.active_element;
			const next_time =
				active_el && typeof active_el.currentTime === 'number' && active_el.currentTime > 0
					? active_el.currentTime
					: state.current_time;
			update((s) =>
				s.active_show ? { ...s, status: 'PAUSED', current_time: next_time } : s
			);
			if (active_el) {
				try {
					active_el.pause();
				} catch {
					// ignore
				}
			}
			notify_player_sync();
		},

		async seek(
			show: { number: number; title: string; slug: string; youtube_url?: string | null },
			seconds: number
		) {
			const state = get(store);
			if (state.active_show?.number === show.number && state.active_element) {
				update((s) => ({
					...s,
					current_time: seconds,
					status: 'PLAYING',
					is_dismissed: false
				}));
				await seek_and_play(state.active_element, seconds, true);
				notify_player_sync();
			} else if (get_youtube_id(show.youtube_url)) {
				await this.start_show(show, seconds);
			}
		},

		toggle_minimize() {
			update((state) => ({
				...state,
				is_minimized: !state.is_minimized,
				is_dismissed: false
			}));
		},

		dismiss_mini_player() {
			const state = get(store);
			const active_el = state.active_element;
			const next_time =
				active_el && typeof active_el.currentTime === 'number' && active_el.currentTime > 0
					? active_el.currentTime
					: state.current_time;
			update((s) =>
				s.active_show
					? {
							...s,
							status: 'PAUSED',
							current_time: next_time,
							in_mini_player: true,
							is_minimized: true,
							is_dismissed: true
						}
					: s
			);
			if (active_el) {
				try {
					active_el.pause();
				} catch {
					// ignore
				}
			}
			notify_player_sync();
		},

		close() {
			const state = get(store);
			const prev_el = state.active_element;
			update(() => ({
				...initial_state
			}));
			if (prev_el) {
				try {
					prev_el.pause();
				} catch {
					// ignore
				}
			}
		}
	};
}

export const youtube_player = create_youtube_player();
