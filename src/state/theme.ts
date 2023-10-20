import { writable } from 'svelte/store';
import Cookie from 'js-cookie';

const default_theme = Cookie.get('theme') || null;

export const theme = writable(default_theme);

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
