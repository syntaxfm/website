import * as Sentry from '@sentry/sveltekit';
import type { Show } from '@prisma/client';
import { get, writable } from 'svelte/store';
import { load_media_session } from '$utilities/media/load_media_session';
import { get_youtube_id } from '$utilities/youtube';
import { minimize, player_window_status, toggle_minimize } from './player_window_status';
import { get_cached_or_network_show } from './player_offline';
import { load_state_from_indexed_db, open_db, STORE_NAME, type PlayerState } from './player_utils';
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

function set_controller_media(media_controller: any, media_el: HTMLElement | null) {
	if (!media_controller || !media_el) return;
	if (typeof media_controller.handleMediaUpdated === 'function') {
		media_controller.handleMediaUpdated(media_el);
	} else if (typeof media_controller.mediaSetCallback === 'function') {
		media_controller.mediaSetCallback(media_el);
	}
}

const new_player_state = () => {
	const initial_state: PlayerState = {
		current_show: null,
		audio: null,
		media_controller: null,
		duration: 0,
		status: 'INITIAL',
		initial_load: true
	};

	const player_state = writable<PlayerState>(initial_state);
	const { update, subscribe, set } = player_state;

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

	// Starts timer that save listening position.
	function save_position(position?: number) {
		const current_state = get(player_state);
		if (current_state.audio && current_state?.current_show?.number) {
			localStorage.setItem(
				`last_played_position_${current_state.current_show.number}`,
				position != null ? position.toString() : current_state.audio.currentTime.toString()
			);
		}
	}

	// Prepares the player for the initial page load. Only called once.
	async function initialize(latest_show: Show) {
		const saved_state = await load_state_from_indexed_db();
		if (saved_state?.current_show) {
			load_show(saved_state.current_show, true);
		} else {
			load_show(latest_show, true);
		}
	}

	// Load show gets player state loaded and audio into playable state
	// This is automatically run if you call start_show
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

		// Load position from local storate
		const local_storage_episode_state = localStorage.getItem(
			`last_played_position_${incoming_show.number}`
		);

		// If it exists, make string a number, otherwise set it to 0
		const actual_episode_state = local_storage_episode_state
			? parseFloat(local_storage_episode_state)
			: 0;

		// If playback is coming from timestamp, use timestamp, otherwise user last played position or 0.
		const resume_time = play_from_position ?? actual_episode_state;

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

	// EVENTS
	function onplay() {
		const current_state = get(player_state);
		if (current_state.current_show && get_youtube_id(current_state.current_show.youtube_url)) {
			if (current_state.audio && !current_state.audio.paused) {
				current_state.audio.pause();
			}
			const yt = get(youtube_player);
			if (yt.active_show?.number === current_state.current_show.number) {
				void youtube_player.play();
			} else {
				void youtube_player.start_show(current_state.current_show);
			}
			return;
		}
		update((state) => ({ ...state, status: 'PLAYING' }));
		if (current_state.current_show) {
			save_position();
		}
	}

	function onpause() {
		const yt_state = get(youtube_player);
		const current_state = get(player_state);
		if (
			yt_state.active_show &&
			current_state.current_show?.number === yt_state.active_show.number &&
			yt_state.status === 'PLAYING'
		) {
			return;
		}
		update((state) => ({ ...state, status: 'PAUSED' }));
		save_position();
	}

	function ontimeupdate() {
		save_position();
	}

	function onended() {
		save_position(0);
	}

	return {
		ontimeupdate,
		subscribe,
		set,
		update,
		load_show,
		initialize,
		onpause,
		onplay,
		onended,

		// The main method for playing a show
		async start_show(requested_show: Show, play_from_position?: number) {
			// If episode has a YouTube video, play the YouTube video instead of the audio file
			if (get_youtube_id(requested_show.youtube_url)) {
				const current = get(player_state);
				if (current.audio && !current.audio.paused) {
					current.audio.pause();
				}

				update((state) => ({
					...state,
					initial_load: false,
					current_show: requested_show,
					status: 'PLAYING'
				}));

				try {
					Sentry.metrics.increment('episode_start', 1, {
						tags: { episode: requested_show.number }
					});
					Sentry.metrics.increment('all_episode_start', 1);
					load_media_session(requested_show);
					save_state_to_indexed_db();
				} catch {
					// ignore analytics/mediaSession errors
				}

				player_window_status.set('ACTIVE');
				await youtube_player.start_show(requested_show, play_from_position);
				return;
			}

			// Fallback to audio file when no YouTube video exists
			youtube_player.close();
			const current = get(player_state);
			set_controller_media(current.media_controller, current.audio);

			const incoming_show = await load_show(requested_show, false, play_from_position);
			try {
				Sentry.metrics.increment('episode_start', 1, { tags: { episode: incoming_show.number } });
				Sentry.metrics.increment('all_episode_start', 1);

				load_media_session(incoming_show);

				save_state_to_indexed_db();

				// This opens the UI Player drawer
				player_window_status.set('ACTIVE');

				// Finally Start Playing
				this.play();
			} catch (error) {
				console.log('setting initial...');
				update((state) => ({ ...state, status: 'INITIAL' }));
			}
		},

		play() {
			const state = get(player_state);
			const yt = get(youtube_player);
			if (state.current_show && get_youtube_id(state.current_show.youtube_url)) {
				if (yt.active_show?.number === state.current_show.number) {
					void youtube_player.play();
					update((s) => ({ ...s, status: 'PLAYING' }));
				} else {
					void this.start_show(state.current_show);
				}
				return;
			}

			youtube_player.pause();
			// On play, update the state writable and play audio
			update((s) => {
				if (s.audio) {
					set_controller_media(s.media_controller, s.audio);
					s.audio.play();
				}
				s.status = 'PLAYING';
				return s;
			});
		},

		pause() {
			const state = get(player_state);
			const yt = get(youtube_player);
			if (
				state.current_show &&
				yt.active_show?.number === state.current_show.number &&
				get_youtube_id(state.current_show.youtube_url)
			) {
				youtube_player.pause();
				update((s) => ({ ...s, status: 'PAUSED' }));
				return;
			}

			// On pause, update the state writable and pause audio
			update((s) => {
				if (s.audio) {
					s.audio.pause();
				}
				s.status = 'PAUSED';
				return s;
			});
		},

		reset() {
			youtube_player.close();
			update((state) => {
				if (state.audio) {
					state.audio.pause();
					state.audio.currentTime = 0;
				}
				set_controller_media(state.media_controller, state.audio);
				return { ...initial_state, audio: state.audio, media_controller: state.media_controller };
			});
		},

		// Jumps the time in the playing show
		update_time(time: number) {
			const state = get(player_state);
			const yt = get(youtube_player);
			if (
				state.current_show &&
				yt.active_show?.number === state.current_show.number &&
				get_youtube_id(state.current_show.youtube_url)
			) {
				youtube_player.seek(state.current_show, time);
				return;
			}

			update((s) => {
				if (s.audio) {
					s.audio.currentTime = time;
				}
				return s;
			});
		},

		close() {
			youtube_player.close();
			update((state) => {
				if (state.audio) {
					if (state.current_show) {
						localStorage.setItem(
							`last_played_position_${state.current_show.number}`,
							state.audio.currentTime.toString()
						);
					}
					state.audio.pause();
					state.audio.removeAttribute('src');
				}
				set_controller_media(state.media_controller, state.audio);
				return { ...initial_state, audio: state.audio, media_controller: state.media_controller };
			});
			player_window_status.set('HIDDEN');
		},

		toggle_minimize,
		minimize
	};
};

export const player = new_player_state();

youtube_player.on_play_pause_audio(() => {
	const current = get(player);
	if (current.audio && !current.audio.paused) {
		current.audio.pause();
	}
});

youtube_player.on_sync_player(({ show, status, element }) => {
	if (!show || status === 'IDLE') return;
	player.update((state) => {
		if (element && state.media_controller) {
			set_controller_media(state.media_controller, element);
		}
		return {
			...state,
			initial_load: false,
			current_show: show as Show,
			status: status === 'PLAYING' ? 'PLAYING' : 'PAUSED'
		};
	});
	if (status === 'PLAYING' && get(player_window_status) === 'HIDDEN') {
		player_window_status.set('ACTIVE');
	}
});
