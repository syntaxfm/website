import { dev } from '$app/environment';
import { get_youtube_live_stream, type YouTubeLiveStream } from '$server/video/youtube_live';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, url }) => {
	let live_stream: YouTubeLiveStream | null = null;

	try {
		live_stream = await get_youtube_live_stream(fetch);
	} catch (error) {
		console.error('Unable to load the active YouTube live stream', error);
	}

	return {
		debug_live_stream: dev && url.searchParams.get('debug_live_stream') === '1',
		live_stream,
		meta: {
			// canonical tells google to use `syntax.fm`, and not syntax.fm?ref=someBlog
			canonical: `${url.protocol}//${url.host}`
		}
	};
};
