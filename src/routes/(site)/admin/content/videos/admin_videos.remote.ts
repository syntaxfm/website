import { command, query } from '$app/server';
import { assert_admin } from '$server/auth/request_auth';
import { db } from '$server/db/client';
import { content, transcript } from '$server/db/schema';
import * as videos from '$server/video/videos';
import { get_youtube_connection } from '$server/video/youtube_owner';
import { and, eq, sql } from 'drizzle-orm';
import * as v from 'valibot';

// Videos come from YouTube (src/server/video/video_sync.ts); the rules for listing and changing
// them live in src/server/video/videos.ts.

const VIDEO_STATUS_VALUES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
const VIDEO_STATUS_FILTER_VALUES = [...VIDEO_STATUS_VALUES, 'ALL'] as const;
const ORDER_VALUES = ['asc', 'desc'] as const;

const list_videos_schema = v.object({
	search_text: v.optional(v.string()),
	status: v.optional(v.picklist(VIDEO_STATUS_FILTER_VALUES)),
	date_from_iso: v.optional(v.string()),
	date_to_iso: v.optional(v.string()),
	order: v.optional(v.picklist(ORDER_VALUES)),
	page: v.optional(v.number()),
	page_size: v.optional(v.number())
});

const update_video_meta_schema = v.object({
	content_id: v.string(),
	status: v.picklist(VIDEO_STATUS_VALUES),
	tag_ids: v.optional(v.array(v.pipe(v.string(), v.trim(), v.minLength(1))))
});

// Queries
// ======================================================

export const list_videos = query(list_videos_schema, async (input) =>
	videos.list_videos(await assert_admin(), input)
);

// Whether captions can be downloaded, and how far the caption backlog has got
export const get_youtube_status = query(async () => {
	await assert_admin();
	const [connection, [counts]] = await Promise.all([
		get_youtube_connection(),
		db
			.select({
				videos: sql<number>`count(*)::int`,
				with_captions: sql<number>`count(${transcript.id})::int`
			})
			.from(content)
			.leftJoin(transcript, eq(transcript.content_id, content.id))
			.where(and(eq(content.type, 'VIDEO'), eq(content.status, 'PUBLISHED')))
	]);
	return { connection, videos: counts?.videos ?? 0, with_captions: counts?.with_captions ?? 0 };
});

// Mutations
// ======================================================

export const update_video_meta = command(update_video_meta_schema, async (input) =>
	videos.update_video_meta(await assert_admin(), input)
);
