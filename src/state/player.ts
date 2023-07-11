import type { Show } from '@prisma/client';
import { writable } from 'svelte/store';

const new_player_state = () => {
	const { subscribe, update, set } = writable<{
		status: 'HIDDEN' | 'ACTIVE' | 'EXPANDED';
		current_show: null | Show;
		playing: boolean;
		audio?: HTMLAudioElement;
	}>({
		status: 'HIDDEN',
		current_show: null,
		playing: false,
		audio: undefined
	});

	function play_show(show: Show) {
		update((state) => {
			state.status = 'ACTIVE';
			state.current_show = show;
			return state;
		});
	}

	function update_time(time_stamp) {}

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
		update_time
	};
};

export const player = new_player_state();
