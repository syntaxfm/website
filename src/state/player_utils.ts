import type { Show } from '@prisma/client';

export interface PlayerState {
	current_show: null | Show;
	audio: null | HTMLAudioElement;
	media_controller: null | HTMLAudioElement;
	duration: number;
	status: 'INITIAL' | 'LOADED' | 'LOADING' | 'PAUSED' | 'PLAYING';
	initial_load: boolean;
}

export const DB_NAME = 'SyntaxDB';
export const STORE_NAME = 'player_state';

export const open_db = (): Promise<IDBDatabase> => {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			db.createObjectStore(STORE_NAME, { keyPath: 'id' });
		};
	});
};

export const load_state_from_indexed_db = async (): Promise<Partial<PlayerState> | null> => {
	try {
		const database = await open_db();
		return new Promise((resolve, reject) => {
			const transaction = database.transaction([STORE_NAME], 'readonly');
			const store = transaction.objectStore(STORE_NAME);
			const request = store.get('current_state');

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				if (request.result) {
					resolve(request.result);
				} else {
					resolve(null);
				}
			};
		});
	} catch (error) {
		console.error('Error loading state from IndexedDB:', error);
		return null;
	}
};

export function get_time_stamp_from_href(href: string) {
	const split_time_stamp = href.split('#t=').at(-1) || '';
	return split_time_stamp
		.split(':')
		.reverse()
		.map(Number)
		.map((num, i) => num * 60 ** i)
		.reduce((acc, num) => acc + num, 0);
}
