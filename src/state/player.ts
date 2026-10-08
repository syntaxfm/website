import * as Sentry from '@sentry/sveltekit';
import type { Show } from '@prisma/client';
import { get, writable } from 'svelte/store';
import { load_media_session } from '$utilities/media/load_media_session';
import { get_youtube_id } from '$utilities/youtube';
import { minimize, player_window_status, toggle_minimize } from './player_window_status';
import { get_cached_or_network_show } from './player_offline';
import { load_state_from_indexed_db, open_db, STORE_NAME, type PlayerState } from './player_utils';
import { media_preference, should_play_video } from './media_preference';
import {
	get_saved_position,
	record_duration,
	save_position as save_media_position,
	timelines_match,
	timelines_match_cached,
	type MediaKind
} from './media_timeline';
import { youtube_player } from './youtube_player';

export interface Timestamp {
	label: string;
	time_stamp: number;
	duration: number;
	percentage: number;
	startingPosition: number;
	href: string;
}

export const episode_share_status = writable<boolean>(false);

// media-chrome has no public API for pointing a <media-controller> at media outside of its slot.
// handleMediaUpdated is what it calls internally when the slotted media changes.
interface MediaControllerElement extends HTMLElement {
	handleMediaUpdated: (media: HTMLElement) => Promise<void> | void;
}

function is_media_controller(el: unknown): el is MediaControllerElement {
	return el instanceof HTMLElement && 'handleMediaUpdated' in el;
}

const new_player_state = () => {
	const initial_state: PlayerState = {
		current_show: null,
		audio: null,
		media_controller: null,
		duration: 0,
		status: 'INITIAL',
		initial_load: true,
		media_kind: 'AUDIO'
	};

	const player_state = writable<PlayerState>(initial_state);
	const { update, subscribe, set } = player_state;

	// The media element the bottom bar's media-chrome controls are currently driving
	let attached_media: HTMLElement | null = null;

	function attach_media(media: HTMLElement | null) {
		const { media_controller } = get(player_state);
		if (!media || media === attached_media || !is_media_controller(media_controller)) return;
		attached_media = media;
		void media_controller.handleMediaUpdated(media);
	}

	// Save state to IndexedDB
	const save_state_to_indexed_db = async () => {
		try {
			const state = get(player_state);
			const database = await open_db();
			return new Promise<void>((resolve, reject) => {
				const transaction = database.transaction([STORE_NAME], 'readwrite');
				const store = transaction.objectStore(STORE_NAME);

				const request = store.put({
					id: 'current_state',
					status: state.status,
					current_show: state.current_show,
					duration: state.duration
				});

				request.onerror = () => reject(request.error);
				request.onsuccess = () => {
					return resolve();
				};

				transaction.oncomplete = () => resolve();
				transaction.onerror = () => reject(transaction.error);
			});
		} catch (error) {
			console.error('Error saving state to IndexedDB:', error);
		}
	};

	// Saves the audio listening position. Throttled unless forced.
	function save_position(force = false, position?: number) {
		const current_state = get(player_state);
		if (current_state.audio && current_state?.current_show?.number) {
			save_media_position(
				current_state.current_show.number,
				'AUDIO',
				position ?? current_state.audio.currentTime,
				force
			);
		}
	}

	function track_episode_start(show: Show) {
		try {
			// Analytics
			Sentry.metrics.increment('episode_start', 1, { tags: { episode: show.number } });
			Sentry.metrics.increment('all_episode_start', 1);

			// Load incomming show into media session
			// Side note: the mediaSession API is neat
			// https://developer.mozilla.org/en-US/docs/Web/API/MediaSession
			load_media_session(show);

			save_state_to_indexed_db();
		} catch (error) {
			console.error('Error tracking episode start:', error);
		}
	}

	// Prepares the player for the initial page load. Only called once.
	async function initialize(latest_show: Show) {
		const saved_state = await load_state_from_indexed_db();
		const show = saved_state?.current_show ?? latest_show;
		await load_show(show, true);
		update((state) => ({ ...state, media_kind: should_play_video(show) ? 'VIDEO' : 'AUDIO' }));
	}

	// Load show gets player state loaded and audio into playable state
	// This is automatically run if you call start_audio
	async function load_show(
		requested_show: Show,
		is_initial_load = false,
		play_from_position?: number
	) {
		if (!is_initial_load) {
			update((state) => {
				state.initial_load = false;
				return state;
			});
		}

		// Check to see if requested show is saved into cache
		const incoming_show = await get_cached_or_network_show(requested_show);

		// If playback is coming from timestamp, use timestamp, otherwise user last played position or 0.
		const resume_time = play_from_position ?? get_saved_position(incoming_show.number, 'AUDIO');

		// Update state for new incomming show
		update((state) => {
			if (state.audio && state.media_controller) {
				state.audio.src = incoming_show.url;
				state.audio.currentTime = resume_time;
				state.current_show = incoming_show;
				state.status = resume_time > 0 ? 'PAUSED' : 'LOADED';
			}
			return state;
		});

		return incoming_show;
	}

	function is_video_active_for(show: Show | null) {
		return Boolean(show) && get(youtube_player).active_show?.number === show?.number;
	}

	// Plays a show's audio file. Positions are on the audio timeline.
	async function start_audio(requested_show: Show, play_from_position?: number, autoplay = true) {
		youtube_player.close();
		update((state) => ({ ...state, media_kind: 'AUDIO' }));
		attach_media(get(player_state).audio);

		const incoming_show = await load_show(requested_show, false, play_from_position);
		try {
			if (autoplay) track_episode_start(incoming_show);

			// This opens the UI Player drawer
			player_window_status.set('ACTIVE');

			// Finally Start Playing
			if (autoplay) play_audio();
		} catch {
			console.log('setting initial...');
			update((state) => ({ ...state, status: 'INITIAL' }));
		}
	}

	// Plays a show's YouTube video, inline if its embed is in view, otherwise in the mini-player.
	// Positions are on the video timeline.
	// resume_in_place: keep playing wherever the video already is (bottom bar play/resume).
	// Otherwise playback moves to the show's embed when it's in view (e.g. a card's "Play" button).
	async function start_video(
		requested_show: Show,
		play_from_position?: number,
		{ resume_in_place = false } = {}
	) {
		const is_active = is_video_active_for(requested_show);
		const is_resume = resume_in_place && is_active && play_from_position == null;
		// Switch media kind before pausing audio so onpause doesn't treat this as the user pausing
		update((state) => ({
			...state,
			initial_load: false,
			current_show: requested_show,
			status: 'PLAYING',
			media_kind: 'VIDEO'
		}));
		get(player_state).audio?.pause();
		if (!is_active) track_episode_start(requested_show);
		player_window_status.set('ACTIVE');

		if (is_resume) {
			await youtube_player.play();
		} else {
			await youtube_player.start_show(requested_show, play_from_position);
		}
	}

	function play_audio() {
		update((state) => {
			if (state.audio) {
				attach_media(state.audio);
				state.audio.play();
			}
			state.status = 'PLAYING';
			return state;
		});
	}

	/**
	 * Plays a show from a timestamp on the audio timeline (show notes, transcript, ?t= links).
	 * Uses the video when its timeline matches the audio, otherwise the audio for exact timing.
	 */
	async function play_timestamp(show: Show, seconds: number) {
		if (should_play_video(show)) {
			if (await timelines_match(show, youtube_player.find_embed(show.number))) {
				await start_video(show, seconds);
				return;
			}
		}

		const state = get(player_state);
		if (state.media_kind === 'AUDIO' && state.current_show?.number === show.number && state.audio) {
			state.audio.currentTime = seconds;
			play_audio();
		} else {
			await start_audio(show, seconds);
		}
	}

	// EVENTS
	function onplay() {
		const current_state = get(player_state);
		// The bottom bar was pointed at the audio element, but this show plays as video
		if (current_state.media_kind === 'VIDEO' && current_state.current_show) {
			void start_video(current_state.current_show, undefined, { resume_in_place: true });
			return;
		}
		update((state) => ({ ...state, status: 'PLAYING' }));
		if (current_state.current_show) {
			save_position(true);
		}
	}

	function onpause() {
		// Audio gets paused when playback moves to the video, that isn't the user pausing
		if (get(player_state).media_kind === 'VIDEO') return;
		update((state) => ({ ...state, status: 'PAUSED' }));
		save_position(true);
	}

	function ontimeupdate() {
		save_position();
	}

	function ondurationchange() {
		const { audio, current_show } = get(player_state);
		if (audio && current_show) {
			record_duration(current_show.number, 'AUDIO', audio.duration);
		}
	}

	function onended() {
		save_position(true, 0);
	}

	// Keep the bottom bar in sync with whatever the YouTube player is doing
	youtube_player.subscribe(({ active_show, status, active_element }) => {
		if (!active_show || status === 'IDLE') return;
		const state = get(player_state);
		const next_status = status === 'PLAYING' ? 'PLAYING' : 'PAUSED';
		const is_new_show = state.current_show?.number !== active_show.number;

		if (is_new_show || state.status !== next_status || state.media_kind !== 'VIDEO') {
			update((s) => ({
				...s,
				initial_load: false,
				current_show: active_show,
				status: next_status,
				media_kind: 'VIDEO'
			}));
		}
		// A video started from its own inline controls
		if (is_new_show && status === 'PLAYING') {
			track_episode_start(active_show);
		}
		if (status === 'PLAYING' && state.audio && !state.audio.paused) {
			state.audio.pause();
		}
		// With no video element mounted, the bottom bar drives the audio element,
		// whose onplay hands back to the video
		attach_media(active_element ?? state.audio);

		if (status === 'PLAYING' && get(player_window_status) === 'HIDDEN') {
			player_window_status.set('ACTIVE');
		}
	});

	return {
		ontimeupdate,
		ondurationchange,
		subscribe,
		set,
		update,
		load_show,
		initialize,
		onpause,
		onplay,
		onended,
		play_timestamp,

		// The main method for playing a show.
		// Plays the YouTube video when there is one (and the user prefers video), otherwise the audio.
		// play_from_position is on the audio timeline (timestamps, share links).
		async start_show(requested_show: Show, play_from_position?: number) {
			if (play_from_position != null) {
				return play_timestamp(requested_show, play_from_position);
			}
			if (should_play_video(requested_show)) {
				return start_video(requested_show);
			}
			return start_audio(requested_show);
		},

		play() {
			const { current_show, media_kind } = get(player_state);
			if (media_kind === 'VIDEO' && current_show) {
				void start_video(current_show, undefined, { resume_in_place: true });
				return;
			}
			play_audio();
		},

		pause() {
			const { current_show, media_kind } = get(player_state);
			if (media_kind === 'VIDEO' && is_video_active_for(current_show)) {
				youtube_player.pause();
				return;
			}

			// On pause, update the state writable and pause audio
			update((state) => {
				if (state.audio) {
					state.audio.pause();
				}
				state.status = 'PAUSED';
				return state;
			});
		},

		/**
		 * Switches between the video and audio versions of the current show.
		 * Carries the position over when the timelines match, otherwise each resumes from its own saved spot.
		 */
		async set_media_kind(kind: MediaKind) {
			media_preference.set(kind);
			const state = get(player_state);
			const show = state.current_show;
			if (!show || state.media_kind === kind || !get_youtube_id(show.youtube_url)) return;
			if (kind === 'VIDEO' && !should_play_video(show)) return;

			const was_playing = state.status === 'PLAYING';
			const from_time =
				kind === 'VIDEO' ? (state.audio?.currentTime ?? 0) : youtube_player.get_current_time();
			const position = (await timelines_match(show, youtube_player.find_embed(show.number)))
				? from_time
				: undefined;

			if (kind === 'AUDIO') {
				await start_audio(show, position, was_playing);
			} else if (was_playing) {
				await start_video(show, position);
			} else {
				// Paused: the next play picks up the video from here
				if (position != null) save_media_position(show.number, 'VIDEO', position, true);
				update((s) => ({ ...s, media_kind: 'VIDEO' }));
			}
		},

		/**
		 * Current position on the audio timeline, or null if the video is playing and
		 * we don't know that its timeline matches the audio (transcripts, timestamps).
		 */
		get_audio_timeline_time(): number | null {
			const { current_show, media_kind, audio } = get(player_state);
			if (!current_show) return null;
			if (media_kind === 'AUDIO') return audio?.currentTime ?? 0;
			return timelines_match_cached(current_show.number) ? youtube_player.get_current_time() : null;
		},

		reset() {
			// Resetting the player state.
			//  Reset the player state and pause audio
			// Set currentTime to 0 (probably doesn't need to happen)
			youtube_player.close();
			update((state) => {
				if (state.audio) {
					state.audio.pause();
					state.audio.currentTime = 0;
				}
				return { ...initial_state, audio: state.audio, media_controller: state.media_controller };
			});
			attach_media(get(player_state).audio);
		},

		// Jumps the time in the playing show, on the timeline of whichever media is playing
		update_time(time: number) {
			const { current_show, media_kind } = get(player_state);
			if (media_kind === 'VIDEO' && current_show && is_video_active_for(current_show)) {
				void youtube_player.seek(current_show, time);
				return;
			}

			update((state) => {
				if (state.audio) {
					state.audio.currentTime = time;
				}
				return state;
			});
		},

		close() {
			youtube_player.close();
			update((state) => {
				if (state.audio) {
					if (state.current_show && state.media_kind === 'AUDIO') {
						save_media_position(state.current_show.number, 'AUDIO', state.audio.currentTime, true);
					}
					state.audio.pause();
					state.audio.removeAttribute('src');
				}
				return { ...initial_state, audio: state.audio, media_controller: state.media_controller };
			});
			attach_media(get(player_state).audio);
			player_window_status.set('HIDDEN');
		},

		toggle_minimize,
		minimize
	};
};

export const player = new_player_state();
