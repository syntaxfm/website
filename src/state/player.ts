import * as Sentry from '@sentry/sveltekit';
import type { Show } from '@prisma/client';
import { get, writable } from 'svelte/store';
import { load_media_session } from '$utilities/media/load_media_session';
import { minimize, player_window_status, toggle_minimize } from './player_window_status';
import { get_cached_or_network_show } from './player_offline';
import { load_state_from_indexed_db, open_db, STORE_NAME, type PlayerState } from './player_utils';

export interface Timestamp {
	label: string;
	time_stamp: number;
	duration: number;
	percentage: number;
	startingPosition: number;
	href: string;
}

export const episode_share_status = writable<boolean>(false);

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
				state.status = 'LOADED';
			}
			return state;
		});

		return incoming_show;
	}

	// EVENTS
	// Add these new functions
	function onplay() {
		update((state) => ({ ...state, status: 'PLAYING' }));
		const current_state = get(player_state);
		if (current_state.current_show) {
			save_position();
		}
	}

	function onpause() {
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
			const incoming_show = await load_show(requested_show, false, play_from_position);
			try {
				// Analytics
				Sentry.metrics.increment('episode_start', 1, { tags: { episode: incoming_show.number } });
				Sentry.metrics.increment('all_episode_start', 1);

				// Load incomming show into media session
				// Side note: the mediaSession API is neat
				// https://developer.mozilla.org/en-US/docs/Web/API/MediaSession
				load_media_session(incoming_show);

				save_state_to_indexed_db();

				// This opens the UI Player drawer
				player_window_status.set('ACTIVE');

				// Finally Start Playing
				this.play();
			} catch (error) {
				update((state) => ({ ...state, status: 'INITIAL' }));
			}
		},

		play() {
			// On play, update the state writable and play audio
			update((state) => {
				if (state.audio) {
					state.audio.play();
				}
				state.status = 'PLAYING';
				return state;
			});
		},

		pause() {
			// On pause, update the state writable and play audio
			update((state) => {
				if (state.audio) {
					state.audio.pause();
				}
				state.status = 'PAUSED';
				return state;
			});
		},

		reset() {
			// Resetting the player state.
			//  Reset the player state and pause audio
			// Set currentTime to 0 (probably doesn't need to happen)
			update((state) => {
				if (state.audio) {
					state.audio.pause();
					state.audio.currentTime = 0;
				}
				return { ...initial_state, audio: state.audio, media_controller: state.media_controller };
			});
		},

		// Jumps the time in the playing show
		update_time(time: number) {
			update((state) => {
				if (state.audio) {
					state.audio.currentTime = time;
				}
				return state;
			});
		},

		close() {
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
				return { ...initial_state, audio: state.audio, media_controller: state.media_controller };
			});
			player_window_status.set('HIDDEN');
		},

		toggle_minimize,
		minimize
	};
};

export const player = new_player_state();
