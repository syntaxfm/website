import { and, eq } from 'drizzle-orm';
import { db } from '$server/db/client';
import { content, video } from '$server/db/schema';
import { edge_cached } from '$server/edge_cache';
import { released_content_clause } from '$server/content/released';
import type { PlayerVideo } from '$state/player_utils';
import { get_watch_url_from_url } from '#lib/videos/utils.ts';

/**
 * A published video that isn't an episode, as the player takes it. Null when it isn't on the site.
 * Edge cached: Home asks on every render, and the answer only changes on the hourly video sync.
 */
export function get_player_video(video_id: string): Promise<PlayerVideo | null> {
	return edge_cached(
		`player-video-${video_id}`,
		{ fresh_seconds: 60 * 5, stale_seconds: 60 * 60 * 24 },
		async () => {
			const [row] = await db
				.select({ title: content.title, slug: content.slug })
				.from(video)
				.innerJoin(content, eq(content.id, video.content_id))
				.where(and(eq(video.id, video_id), released_content_clause()))
				.limit(1);
			if (!row) return null;
			return {
				kind: 'VIDEO',
				title: row.title,
				slug: row.slug,
				youtube_url: get_watch_url_from_url(video_id)
			};
		}
	);
}
