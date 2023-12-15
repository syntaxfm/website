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

	async function start_show(show: Show) {
		// Get current state
		const current_state = get(player_state);
		if (current_state.status === 'PLAYING') {
			pause();
		} else if (current_state.status === 'PAUSED') {
			play();
		} else {
			return new Promise((resolve) => {
				loadMediaSession(show);
				update((state) => {
					state.current_show = show;
					state.status = 'LOADED';
					// state.audio should always exist because it's the audio element
					if (state.audio) {
						pause();
						state.audio.src = show.url;
						state.audio.crossOrigin = 'anonymous';

						// Wait for the audio to be ready to play
						state.audio.addEventListener('loadedmetadata', () => {
							if (state.audio) {
								state.audio.currentTime = 0;
								resolve(play());
							}
						});
					}

					return state;
				});
				player_window_status.set('ACTIVE');
			});
		}
	}

	function play() {
		update((state) => {
			state?.audio?.play();
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
