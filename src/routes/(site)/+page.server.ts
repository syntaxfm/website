import { dev } from '$app/env';
import { get_player_show_for_video } from '$server/shows/shows_queries';
import { get_youtube_hero_video, type YouTubeHeroVideo } from '$server/video/youtube_hero';
import type { PlayerShow } from '$state/player_utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, url }) => {
	let hero_video: YouTubeHeroVideo | null = null;
	// The episode the hero's video belongs to, so it plays in the site's player. A live stream isn't
	// an episode yet, and some videos never are.
	let hero_show: PlayerShow | null = null;

	try {
		hero_video = await get_youtube_hero_video(fetch);
		if (hero_video && !hero_video.is_live) {
			hero_show = await get_player_show_for_video(hero_video.id);
		}
	} catch (error) {
		console.error("Unable to load the video for Home's hero", error);
	}

	return {
		debug_live_stream: dev && url.searchParams.get('debug_live_stream') === '1',
		hero_video,
		hero_show,
		meta: {
			// canonical tells google to use `syntax.fm`, and not syntax.fm?ref=someBlog
			canonical: `${url.protocol}//${url.host}`
		}
	};
};
