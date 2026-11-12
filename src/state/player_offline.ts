const CACHE_NAME = 'mp3-cache';
// Marks a copy the player kept by itself. Copies without it were saved by the listener and stay
// until they clear them.
const KEPT_AT_HEADER = 'Kept-At';
// An episode's audio runs around 100 MB
const KEPT_EPISODES = 3;

// Tried at most once per visit, so a failed or refused download isn't started over and over
const attempted = new Set<string>();

export async function check_for_cached_mp3(path: string) {
	if (typeof caches !== 'undefined') {
		try {
			const cache = await caches.open(CACHE_NAME);
			const cache_response = await cache.match(path);
			return cache_response;
		} catch (error) {
			console.error('Failed to retrieve MP3 file from cache:', error);
			return null;
		}
	}
	return null;
}

/**
 * An address the audio element can play the device's copy of this audio from, or null when the
 * device has no copy.
 */
export async function get_device_audio_url(audio_url: string): Promise<string | null> {
	const response = await check_for_cached_mp3(audio_url);
	if (!response) return null;
	return URL.createObjectURL(await response.blob());
}

// Only Chromium says. Elsewhere there's no way to tell.
function is_on_limited_data(): boolean {
	const connection: unknown = 'connection' in navigator ? navigator.connection : undefined;
	if (typeof connection !== 'object' || connection === null) return false;
	const is_saving_data = 'saveData' in connection && connection.saveData === true;
	const is_cellular = 'type' in connection && connection.type === 'cellular';
	return is_saving_data || is_cellular;
}

async function has_room_for(bytes: number): Promise<boolean> {
	if (!navigator.storage?.estimate) return true;
	const { quota, usage = 0 } = await navigator.storage.estimate();
	return quota === undefined || quota - usage > bytes;
}

async function clear_older_kept_copies(cache: Cache) {
	const kept: { request: Request; kept_at: number }[] = [];
	for (const request of await cache.keys()) {
		const response = await cache.match(request);
		const kept_at = Number(response?.headers.get(KEPT_AT_HEADER));
		if (kept_at > 0) kept.push({ request, kept_at });
	}
	kept.sort((a, b) => b.kept_at - a.kept_at);
	await Promise.all(kept.slice(KEPT_EPISODES).map(({ request }) => cache.delete(request)));
}

/**
 * Keeps a copy of an episode's audio on the device, so later listens play it from there. The audio
 * host tells browsers never to cache it, so without this every listen downloads it again.
 * This is a second download beside the one that's playing, so it's skipped for listeners on
 * limited data. Only the newest few kept episodes stay.
 */
export async function keep_audio_on_device(audio_url: string): Promise<void> {
	if (typeof caches === 'undefined' || attempted.has(audio_url)) return;
	attempted.add(audio_url);
	if (is_on_limited_data()) return;

	try {
		const cache = await caches.open(CACHE_NAME);
		if (await cache.match(audio_url)) return;

		const response = await fetch(audio_url, { priority: 'low' });
		if (!response.ok || !response.body) return;
		if (!(await has_room_for(Number(response.headers.get('Content-Length'))))) {
			await response.body.cancel();
			return;
		}

		// Streamed straight to disk, never held whole in memory
		await cache.put(
			audio_url,
			new Response(response.body, {
				headers: {
					'Content-Type': response.headers.get('Content-Type') ?? 'audio/mpeg',
					[KEPT_AT_HEADER]: Date.now().toString()
				}
			})
		);
		await clear_older_kept_copies(cache);
	} catch (error) {
		// Playback doesn't depend on this: the episode keeps playing from the network
		console.error('Failed to keep the audio on this device:', error);
	}
}
