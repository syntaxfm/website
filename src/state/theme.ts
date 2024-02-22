import { writable } from 'svelte/store';

const new_theme_maker = () => {
	const { subscribe, update, set } = writable({
		status: 'CLOSED'
	});

	function open() {
		update((theme) => {
			return { ...theme, status: 'OPEN' };
		});
	}

	function close() {
		update((theme) => {
			return { ...theme, status: 'CLOSED' };
		});
	}

	function toggle() {
		update((theme) => {
			return { ...theme, status: status === 'CLOSED' ? 'OPEN' : 'CLOSED' };
		});
	}

	return {
		subscribe,
		update,
		set,
		close,
		open,
		toggle
	};
};

export const theme_maker = new_theme_maker();
