import type { Show } from '@prisma/client';
import { writable, get } from 'svelte/store';
import coverArt from '$assets/coverart-128.png';
import coverArt512 from '$assets/coverart-512.png';

export interface Timestamp {
	label: string;
	time_stamp: number;
	duration: number;
	percentage: number;
	startingPosition: number;
	href: string;
}

function loadMediaSession(show: Show) {
	if (!('mediaSession' in navigator)) {
		console.log(`The Media Session API is not supported on this platform.`);
		return;
	}
	console.log(`The Media Session API is supported on this platform.`);
	navigator.mediaSession.metadata = new MediaMetadata({
		title: show.title,
		artist: 'Syntax Podcast',
		artwork: [
			{
				src: coverArt,
				sizes: '128x128',
				type: 'image/png'
			},
			{
				src: coverArt512,
				sizes: '512x512',
				type: 'image/png'
			}
		]
	});
}

interface PlayerState {
	current_show: null | Show;
	playing: boolean;
	currentTime: number;
	audio?: HTMLAudioElement;
	media_controller?: HTMLAudioElement;
	status: 'INITIAL' | 'LOADED' | 'PAUSED' | 'PLAYING';
}

// Having this state in the same writeable was causing hiccups ins the audio when updating the store
export const player_window_status = writable<'HIDDEN' | 'ACTIVE' | 'MINI'>('HIDDEN');
export const episode_share_status = writable<boolean>(false);

const reset_state = {
	playing: false,
	status: 'INITIAL'
} as const;

const new_player_state = () => {
	const player_state = writable<PlayerState>({
		current_show: null,
		playing: false,
		audio: undefined,
		media_controller: undefined,
		currentTime: 0,
		status: 'INITIAL'
	});
	const { update, subscribe, set } = player_state;

	async function start_show(show: Show, start_time = 0) {
		console.log('start_time', start_time);
		// Get current state
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
		return new Promise((resolve) => {
			loadMediaSession(show);
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
			state.audio.currentTime = 0;
			state = {
				...state,
				...reset_state,
				currentTime: 0 // Explicitly set currentTime in the state as well
			};
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

	function toggle_minimize() {
		player_window_status.update((state) => {
			return state !== 'MINI' ? 'MINI' : 'ACTIVE';
		});
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

	function minimize() {
		player_window_status.set('MINI');
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
