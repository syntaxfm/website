import type { Show } from '@prisma/client';

export async function check_for_cached_mp3(path: string) {
	const cache = await caches.open('mp3-cache');
	try {
		const cache_response = await cache.match(path);
		return cache_response;
	} catch (error) {
		console.error('Failed to retrieve MP3 file from cache:', error);
		return null;
	}
}

// takes in a show and returns either a cached or network mp3.
export async function get_cached_or_network_show(show: Show): Promise<Show> {
	const cached_show_response = await check_for_cached_mp3(show.url);
	if (cached_show_response) {
		const meta = cached_show_response.headers.get('Metadata');
		const meta_parsed = JSON.parse(meta ?? '');
		const blob = await cached_show_response.blob();
		if (blob) {
			// Create a new URL object from the blob
			const url = URL.createObjectURL(blob);
			return {
				...meta_parsed,
				url
			};
		}
	}
	return show;
}
