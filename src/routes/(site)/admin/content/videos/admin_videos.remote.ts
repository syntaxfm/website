import { command, query } from '$app/server';
import { assert_admin } from '$server/auth/request_auth';
import { db } from '$server/db/client';
import { content, content_tags, transcript, video } from '$server/db/schema';
import { get_youtube_connection } from '$server/video/youtube_owner';
import { error } from '@sveltejs/kit';
import { and, asc, desc, eq, gte, ilike, lte, sql } from 'drizzle-orm';
import * as v from 'valibot';

// Videos come from YouTube (src/server/video/video_sync.ts), which owns their title, description
// and date. Admin decides whether one is on the site (status) and its topics (tags). A deleted
// video would only come back on the next sync, so archiving is how one leaves the site.

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

function parse_optional_iso_date(maybe_iso: string | null | undefined) {
	if (!maybe_iso) return null;
	const parsed_date = new Date(maybe_iso);
	return Number.isNaN(parsed_date.getTime()) ? null : parsed_date;
}

// Queries
// ======================================================

export const list_videos = query(list_videos_schema, async (input) => {
	await assert_admin();

	const search_text = input.search_text?.trim() || '';
	const status = input.status || 'ALL';
	const order = input.order || 'desc';
	const page = Math.max(1, input.page || 1);
	const page_size = Math.min(100, Math.max(1, input.page_size || 25));

	const where_clauses = [eq(content.type, 'VIDEO' as const)];
	if (search_text.length > 0) where_clauses.push(ilike(content.title, `%${search_text}%`));
	if (status !== 'ALL') where_clauses.push(eq(content.status, status));
	const date_from = parse_optional_iso_date(input.date_from_iso);
	if (date_from) where_clauses.push(gte(content.published_at, date_from));
	const date_to = parse_optional_iso_date(input.date_to_iso);
	if (date_to) where_clauses.push(lte(content.published_at, date_to));
	const where_clause = and(...where_clauses);

	const [[count_row], items] = await Promise.all([
		db
			.select({ total: sql<number>`count(*)::int` })
			.from(content)
			.innerJoin(video, eq(video.content_id, content.id))
			.where(where_clause),
		db
			.select({
				content_id: content.id,
				title: content.title,
				slug: content.slug,
				status: content.status,
				published_at: content.published_at,
				youtube_id: video.id,
				duration_seconds: video.duration_seconds,
				view_count: video.view_count,
				has_transcript: sql<boolean>`${transcript.id} is not null`
			})
			.from(content)
			.innerJoin(video, eq(video.content_id, content.id))
			.leftJoin(transcript, eq(transcript.content_id, content.id))
			.where(where_clause)
			.orderBy(order === 'asc' ? asc(content.published_at) : desc(content.published_at))
			.limit(page_size)
			.offset((page - 1) * page_size)
	]);

	const total = count_row?.total ?? 0;
	return {
		items,
		total,
		page,
		page_size,
		total_pages: Math.max(1, Math.ceil(total / page_size))
	};
});

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

export const update_video_meta = command(update_video_meta_schema, async (input) => {
	await assert_admin();

	await db.transaction(async (tx) => {
		const updated_rows = await tx
			.update(content)
			.set({ status: input.status, updated_at: new Date() })
			.where(and(eq(content.id, input.content_id), eq(content.type, 'VIDEO')))
			.returning({ id: content.id });

		if (updated_rows.length === 0) {
			error(404, 'Video not found');
		}

		if (input.tag_ids !== undefined) {
			const tag_ids = [...new Set(input.tag_ids)].sort();

			await tx.delete(content_tags).where(eq(content_tags.content_id, input.content_id));
			if (tag_ids.length > 0) {
				await tx
					.insert(content_tags)
					.values(tag_ids.map((tag_id) => ({ content_id: input.content_id, tag_id })));
			}
		}
	});

	return { success: true };
});
