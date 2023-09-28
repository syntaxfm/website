import type { Show } from '@prisma/client';
import { writable } from 'svelte/store';

export interface Timestamp {
	label: string;
	time_stamp: number;
	duration: number;
	percentage: number;
	startingPosition: number;
	href: string;
}

const new_player_state = () => {
	const { subscribe, update, set } = writable<{
		status: 'HIDDEN' | 'ACTIVE' | 'EXPANDED';
		current_show: null | Show;
		playing: boolean;
		audio?: HTMLAudioElement;
		currentTime: number;
	}>({
		status: 'HIDDEN',
		current_show: null,
		playing: false,
		audio: undefined,
		currentTime: 0
	});

	function play_show(show: Show) {
		update((state) => {
			state.status = 'ACTIVE';
			state.current_show = show;
			console.log('state.audio', state.audio);
			if (state.audio) {
				state.audio.pause();
				state.audio.src = show.url;
				state.audio.crossOrigin = 'anonymous';

				// Wait for the audio to be ready to play
				state.audio.addEventListener('loadedmetadata', () => {
					console.log('state.audio', state.audio);
					state.audio.currentTime = 0;
					state.audio.play();
				});
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
				state.status = 'ACTIVE';
				state.audio?.play();
				return state;
			});
		}

		subscribe((state) => {
			if (state.audio) state.audio.currentTime = time_stamp;
		});
	}

	function toggle_expand() {
		update((state) => {
			state.status = state.status === 'ACTIVE' ? 'EXPANDED' : 'ACTIVE';
			return state;
		});
	}

	function close() {
		update((state) => {
			state.status = 'HIDDEN';
			return state;
		});
	}

	return {
		subscribe,
		update,
		play_show,
		toggle_expand,
		close,
		update_time,
		set
	};
};

export const player = new_player_state();
