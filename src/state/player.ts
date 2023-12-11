import type { Show } from '@prisma/client';
import { writable } from 'svelte/store';
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
}


// Having this state in the same writeable was causing hiccups ins the audio when updating the store
export const player_status = writable<'HIDDEN' | 'ACTIVE' | 'MINI'>('HIDDEN');

const new_player_state = () => {
	const { subscribe, update, set } = writable<PlayerState>({
		current_show: null | Show;
		playing: boolean;
		audio?: HTMLAudioElement;
		currentTime: number;
	}>({
		current_show: null,
		playing: false,
		audio: undefined,
		currentTime: 0
	});

	async function play_show(show: Show) {
		return new Promise((resolve) => {
			loadMediaSession(show);
			update((state) => {
				state.current_show = show;
				if (state.audio) {
					state.audio.pause();
					state.audio.src = show.url;
					state.audio.crossOrigin = 'anonymous';

					// Wait for the audio to be ready to play
					state.audio.addEventListener('loadedmetadata', () => {
						console.log('loadedmetadata');
						if (state.audio) {
							state.audio.currentTime = 0;
							resolve(state.audio.play());
						}
					});
				}

				return state;
			});
			player_status.set('ACTIVE');
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
			player_status.set('ACTIVE');
		}
	}

	function toggle_minimize() {
		player_status.update((state) => {
			return state !== 'MINI' ? 'MINI' : 'ACTIVE';
		});
	}

	function close() {
		player_status.set('HIDDEN');
		update((state) => {
			state.current_show = null;
			state.playing = false;
			state.currentTime = 0;

			if (state.audio) {
				state.audio.pause();
				state.audio.src = '';
				state.audio.crossOrigin = null;
				state.audio.currentTime = 0;
			}

			return state;
		});
	}

	function minimize() {
		player_status.set('MINI');
	}

	return {
		subscribe,
		update,
		play_show,
		toggle_minimize,
		close,
		update_time,
		set,
		minimize
	};
};

export const player = new_player_state();
