import { browser } from '$app/environment';

export class LocalStore<T> {
	#value = $state<T>() as T;
	key = '';

	constructor(key: string, initial: T) {
		this.key = key;

		if (browser) {
			const item = localStorage.getItem(key);
			this.#value = item ? this.deserialize(item) : initial;
		} else {
			this.#value = initial;
		}
	}

	get value(): T {
		return this.#value;
	}

	set value(v: T) {
		this.#value = v;
		if (browser) {
			localStorage.setItem(this.key, this.serialize(v));
		}
	}

	serialize(value: T): string {
		return JSON.stringify(value);
	}

	deserialize(item: string): T {
		return JSON.parse(item);
	}
}

export function localStore<T>(key: string, value: T) {
	return new LocalStore(key, value);
}
