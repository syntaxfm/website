import * as Sentry from '@sentry/sveltekit';
import type { Show } from '@prisma/client';
import { get, writable } from 'svelte/store';
import { load_media_session } from '$utilities/media/load_media_session';
import { minimize, player_window_status, toggle_minimize } from './player_window_status';
import { get_cached_or_network_show } from './player_offline';

export interface Timestamp {
	label: string;
	time_stamp: number;
	duration: number;
	percentage: number;
	startingPosition: number;
	href: string;
}

interface PlayerState {
	current_show: null | Show;
	current_time: number;
	audio: null | HTMLAudioElement;
	media_controller: null | HTMLAudioElement;
	duration: number;
	status: 'INITIAL' | 'LOADED' | 'LOADING' | 'PAUSED' | 'PLAYING';
}

export const episode_share_status = writable<boolean>(false);

const initial_state: PlayerState = {
	current_show: null,
	audio: null,
	media_controller: null,
	current_time: 0,
	duration: 0,
	status: 'INITIAL'
};

const new_player_state = () => {
	const player_state = writable<PlayerState>(initial_state);

	const { update, subscribe, set } = player_state;

	let save_position_interval: number | null = null;

	function start_save_position_interval(show_number: number) {
		stop_save_position_interval();
		save_position_interval = window.setInterval(() => {
			const current_state = get(player_state);
			if (current_state.status === 'PLAYING' && current_state.audio) {
				localStorage.setItem(
					`last_played_position_${show_number}`,
					current_state.audio.currentTime.toString()
				);
			}
		}, 1000); // Save every 5 seconds
	}

	function stop_save_position_interval() {
		if (save_position_interval) {
			clearInterval(save_position_interval);
			save_position_interval = null;
		}
	}

	return {
		subscribe,
		set,
		update,

		async start_show(requested_show: Show, play_from_position?: number) {
			console.log('requested_show', requested_show);
			update((state) => ({ ...state, status: 'LOADING' }));
			try {
				const incoming_show = await get_cached_or_network_show(requested_show);
				const current_state = get(player_state);

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

				// If the incoming show is different from the current show
				if (incoming_show.url !== current_state.audio?.src) {
					// Analytics
					Sentry.metrics.increment('episode_start', 1, { tags: { episode: incoming_show.number } });
					Sentry.metrics.increment('all_episode_start', 1);

					// Load incomming show into media session
					// Side note: the mediaSession API is neat
					// https://developer.mozilla.org/en-US/docs/Web/API/MediaSession
					load_media_session(incoming_show);

					// Update state for new incomming show
					update((state) => {
						if (state.audio) {
							state.audio.src = incoming_show.url;
							state.audio.currentTime = resume_time;
						}
						state.current_show = incoming_show;
						state.status = 'LOADED';
						// TODO: figure out if I realllllly need this current_time state. why not just use the audio element itself? - Scott - I worte it.
						state.current_time = resume_time;
						return state;
					});

					// Starts timer that save listening position.
					// We're listening to this because the event from audio is firing too often and set to 0 when a new episode is loaded. This works better.
					start_save_position_interval(incoming_show.number);

					// This opens the UI Player drawer
					player_window_status.set('ACTIVE');
				}

				// Finally Start Playing
				this.play();
			} catch (error) {
				console.error('Error loading show:', error);
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
			// First stop the local storage save interval
			stop_save_position_interval();

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
				state.current_time = time;
				return state;
			});
		},

		close() {
			stop_save_position_interval();
			update((state) => {
				if (state.audio) {
					if (state.current_show) {
						localStorage.setItem(
							`last_played_position_${state.current_show.number}`,
							state.audio.currentTime.toString()
						);
					}
					state.audio.pause();
					state.audio.src = '';
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
