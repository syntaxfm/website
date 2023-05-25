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

	return {
		subscribe,
		update,
		play_show
	};
};

export const player = new_player_state();
