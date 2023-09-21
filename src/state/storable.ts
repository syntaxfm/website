import { get, writable } from 'svelte/store';

export function storable(data: unknown) {
	const store = writable(data);
	const { subscribe, set } = store;
	const isBrowser = typeof window !== 'undefined';

	isBrowser && localStorage.storable && set(JSON.parse(localStorage.storable));

	return {
		subscribe,
		set: (n: unknown) => {
			isBrowser && (localStorage.storable = JSON.stringify(n));
			set(n);
		},
		update: (cb: (_: unknown) => unknown) => {
			const updatedStore = cb(get(store));

			isBrowser && (localStorage.storable = JSON.stringify(updatedStore));
			set(updatedStore);
		}
	};
}
