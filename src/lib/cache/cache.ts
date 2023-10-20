import kvjs from '@heyputer/kv.js';

export const client = new kvjs();

export const cache = {
	set: async function (key: string, value: object) {
		try {
			const stringValue = JSON.stringify(value);
			return client.set(key, stringValue);
		} catch (e) {
			console.error('e', e);
		}
	},

	get: async function (key: string) {
		try {
			const value = await client.get(key);
			if (value) return JSON.parse(value, reviver);
		} catch (e) {
			console.error('Cache check failed', e);
			return '';
		}
	}
};

const reviver = (key: string, value: string) => {
	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
		return new Date(value);
	} else {
		return value;
	}
};
