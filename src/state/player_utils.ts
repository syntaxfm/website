import type { Path } from '$app/types';
import type { Show } from '$server/db/types';
import get_show_path from '$utilities/slug';
import { get_id_from_url } from '#lib/videos/utils.ts';
import type { MediaKind } from './media_timeline';

/**
 * The fields the player reads from a show: `url` to play it, `youtube_url` to play its video,
 * `number`/`title`/`slug` for the title link, share button and media session. Callers with a full
 * database `Show` satisfy it as-is; list cards pass only these fields and have no `id`.
 */
export type PlayerShow = Pick<Show, 'number' | 'title' | 'slug' | 'url'> & {
	id?: Show['id'];
	youtube_url?: Show['youtube_url'];
};

/**
 * A YouTube video that isn't an episode. It only plays as video: there's no audio file.
 */
export type PlayerVideo = {
	kind: 'VIDEO';
	title: string;
	slug: string;
	youtube_url: string;
};

// Anything the player can play
export type PlayerItem = PlayerShow | PlayerVideo;

export function is_player_video(item: object): item is PlayerVideo {
	return 'kind' in item && item.kind === 'VIDEO';
}

/**
 * What the player knows an item by, for saved positions and telling items apart.
 * An episode's is its number, which keeps the positions saved before videos could play.
 */
export function get_episode_media_key(show_number: number): string {
	return String(show_number);
}

export function get_media_key(item: PlayerVideo | Pick<PlayerShow, 'number'>): string {
	if (!is_player_video(item)) return get_episode_media_key(item.number);
	return `video-${get_id_from_url(item.youtube_url) ?? item.slug}`;
}

export function is_same_media(a: PlayerItem | null | undefined, b: PlayerItem | null | undefined) {
	if (!a || !b) return false;
	return get_media_key(a) === get_media_key(b);
}

// The episode number of a playing item, null for a video or nothing playing
export function get_episode_number(item: PlayerItem | null | undefined): number | null {
	return item && !is_player_video(item) ? item.number : null;
}

export function get_media_path(item: PlayerItem): Path {
	return is_player_video(item) ? `/videos/${item.slug}` : get_show_path(item);
}

// The player bar's title
export function get_media_title(item: PlayerItem): string {
	return is_player_video(item) ? item.title : `Show #${item.number} - ${item.title}`;
}

// How button labels name an item: "Play episode 790", "Play <video title>"
export function get_media_name(item: PlayerItem): string {
	return is_player_video(item) ? item.title : `episode ${item.number}`;
}

export interface PlayerState {
	current_show: null | PlayerItem;
	audio: null | HTMLAudioElement;
	media_controller: null | HTMLAudioElement;
	duration: number;
	status: 'INITIAL' | 'LOADED' | 'LOADING' | 'PAUSED' | 'PLAYING';
	initial_load: boolean;
	// Whether the current show is playing from the audio file or the YouTube video
	media_kind: MediaKind;
}

const DB_NAME = 'SyntaxDB';
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
