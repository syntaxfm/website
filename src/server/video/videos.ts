import { error } from '@sveltejs/kit';
import { and, asc, desc, eq, gte, ilike, lte, sql } from 'drizzle-orm';

import { assert_admin_actor, is_admin, type Actor } from '$server/auth/authorization';
import { db } from '$server/db/client';
import { content, content_tags, transcript, video } from '$server/db/schema';
import { parse_optional_iso_date } from '$utilities/parse_optional_iso_date';

// Videos: Syntax's YouTube uploads as Content. YouTube owns their title, description and date
// (video_sync.ts); the site decides whether one is shown (status) and its topics (tags). A deleted
// video would only come back on the next sync, so archiving is how one leaves the site. The admin
// Videos page (admin_videos.remote.ts) and the MCP endpoint (server/mcp) both call these with the
// person acting.

type VideoStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ListVideosInput {
	search_text?: string;
	status?: VideoStatus | 'ALL';
	date_from_iso?: string;
	date_to_iso?: string;
	order?: 'asc' | 'desc';
	page?: number;
	page_size?: number;
}

export interface UpdateVideoMetaInput {
	content_id: string;
	status: VideoStatus;
	tag_ids?: string[];
}

/**
 * One page of videos by release date. Admins see every status; anyone else only released videos
 * (published and dated now or earlier), whatever status they ask for.
 */
export async function list_videos(actor: Actor, input: ListVideosInput) {
	const search_text = input.search_text?.trim() || '';
	const status = input.status || 'ALL';
	const order = input.order || 'desc';
	const page = Math.max(1, input.page || 1);
	const page_size = Math.min(100, Math.max(1, input.page_size || 25));

	const where_clauses = [eq(content.type, 'VIDEO' as const)];
	if (!is_admin(actor)) {
		where_clauses.push(eq(content.status, 'PUBLISHED'), lte(content.published_at, new Date()));
	}
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
}

/** Sets a video's status and, when tag_ids is given, replaces its tags with them. */
export async function update_video_meta(actor: Actor, input: UpdateVideoMetaInput) {
	assert_admin_actor(actor);

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
}
