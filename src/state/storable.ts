import { get, writable } from 'svelte/store';

export function storable(data: unknown) {
	const store = writable(data);
	const { subscribe, set } = store;
	const is_browser = typeof window !== 'undefined';

	is_browser && localStorage.storable && set(JSON.parse(localStorage.storable));

	return {
		subscribe,
		set: (n: unknown) => {
			is_browser && (localStorage.storable = JSON.stringify(n));
			set(n);
		},
		update: (cb: (_: unknown) => unknown) => {
			const updated_store = cb(get(store));

			is_browser && (localStorage.storable = JSON.stringify(updated_store));
			set(updated_store);
		}
	};
}
