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
	playing: boolean;
	currentTime: number;
	audio?: HTMLAudioElement;
	media_controller?: HTMLAudioElement;
	status: 'INITIAL' | 'LOADED' | 'PAUSED' | 'PLAYING';
}

export const episode_share_status = writable<boolean>(false);

const reset_state = {
	playing: false,
	status: 'INITIAL'
} as const;

const new_player_state = () => {
	const player_state = writable<PlayerState>({
		current_show: null,
		audio: undefined,
		media_controller: undefined,
		currentTime: 0,
		...reset_state
	});

	const { update, subscribe, set } = player_state;

	async function start_show(requested_show: Show, start_time = 0) {
		// First we check to see if the use has cached the mp3 offline
		const show = await get_cached_or_network_show(requested_show);
		const current_state = get(player_state);
		if (show.url !== current_state?.audio?.src) {
			return initialize_audio(show, start_time);
		} else {
			if (current_state.status === 'PLAYING') {
				return pause();
			} else if (current_state.status === 'PAUSED') {
				return play();
			} else {
				return initialize_audio(show, start_time);
			}
		}
	}

	function initialize_audio(show: Show, start_time: number = 0) {
		// # Increment a counter for a specific episode
		Sentry.metrics.increment('episode_start', 1, { tags: { episode: show.number } });
		// # Increment a total counter for all episodes
		Sentry.metrics.increment('all_episode_start', 1);

		return new Promise((resolve) => {
			load_media_session(show);
			update((state) => {
				state.current_show = show;
				state.status = 'LOADED';
				if (state.audio) {
					pause();

					state.audio.src = show.url;
					state.audio.crossOrigin = 'anonymous';
					state.audio.currentTime = 0;

					// Wait for the audio to be ready to play
					state.audio.addEventListener('loadedmetadata', () => {
						if (state.audio) {
							resolve(play(start_time));
						}
					});
					state.audio.addEventListener('ended', reset);
				}

				return state;
			});
			player_window_status.set('ACTIVE');
		});
	}

	function play(time_stamp: number = 0) {
		update((state) => {
			state?.audio?.play().then(() => {
				if (time_stamp && state.audio) state.audio.currentTime = time_stamp;
			});
			state.currentTime = time_stamp;
			state.status = 'PLAYING';
			return state;
		});
	}

	function pause() {
		update((state) => {
			state?.audio?.pause();
			state.status = 'PAUSED';
			return state;
		});
	}

	function reset() {
		update((state) => {
			if (state.audio) {
				state.audio.currentTime = 0;
				state = {
					...state,
					...reset_state,
					currentTime: 0 // Explicitly set currentTime in the state as well
				};
			}
			return state;
		});
	}

	function update_time(href: string, show?: Show) {
		const split_time_stamp = href.split('#t=').at(-1) || '';
		const time_stamp = split_time_stamp
			.split(':')
			.reverse()
			.map(Number)
			.map((num, i) => num * 60 ** i)
			.reduce((acc, num) => acc + num, 0);

		if (show) {
			update((state) => {
				state.current_show = show;

				state.audio?.play().then(() => {
					// Wait for the audio to be ready to play before setting the new timestamp
					if (state.audio) state.audio.currentTime = time_stamp;
				});
				return state;
			});
			player_window_status.set('ACTIVE');
		}
	}

	function close() {
		player_window_status.set('HIDDEN');
		update((state) => {
			if (state.audio) {
				state.audio.pause();
				state.audio.src = '';
				state.audio.crossOrigin = null;
				state.audio.currentTime = 0;
			}

			state.current_show = null;
			state.playing = false;
			state.currentTime = 0;
			state.status = 'INITIAL';

			return state;
		});
	}

	return {
		subscribe,
		update,
		start_show,
		toggle_minimize,
		close,
		update_time,
		set,
		minimize,
		pause,
		play
	};
};

export const player = new_player_state();
