import { writable } from 'svelte/store';

// Having this state in the same writeable was causing hiccups ins the audio when updating the store
export const player_window_status = writable<'HIDDEN' | 'ACTIVE' | 'MINI'>('ACTIVE');

export function minimize() {
	player_window_status.set('MINI');
}

export function toggle_minimize() {
	player_window_status.update((state) => {
		return state !== 'MINI' ? 'MINI' : 'ACTIVE';
	});
}
