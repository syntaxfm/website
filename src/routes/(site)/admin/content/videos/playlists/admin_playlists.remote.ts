import { randomUUID } from 'node:crypto';
import { command, getRequestEvent, query } from '$app/server';
import { db } from '$server/db/client';
import { content, playlist, playlistOnVideo, video } from '$server/db/schema';
import { error } from '@sveltejs/kit';
import { and, asc, desc, eq, ilike, ne, notInArray, sql } from 'drizzle-orm';
import * as v from 'valibot';
import get_slug from 'speakingurl';

const list_playlists_schema = v.object({
	search_text: v.optional(v.string()),
	page: v.optional(v.number()),
	page_size: v.optional(v.number())
});

const create_playlist_schema = v.object({
	title: v.pipe(v.string(), v.trim(), v.minLength(1))
});

const update_playlist_schema = v.object({
	id: v.pipe(v.string(), v.trim(), v.minLength(1)),
	title: v.pipe(v.string(), v.trim(), v.minLength(1)),
	slug: v.pipe(v.string(), v.trim(), v.minLength(1))
});

const playlist_video_schema = v.object({
	playlist_id: v.pipe(v.string(), v.trim(), v.minLength(1)),
	video_id: v.pipe(v.string(), v.trim(), v.minLength(1))
});

const search_videos_schema = v.object({
	playlist_id: v.pipe(v.string(), v.trim(), v.minLength(1)),
	search_text: v.optional(v.string())
});

function assert_admin_user() {
	const event = getRequestEvent();
	if (!event.locals?.user?.roles?.includes('admin')) {
		error(403, 'Admin access required');
	}
	return event;
}

function normalize_slug(input_text: string) {
	return get_slug(input_text, {
		separator: '-',
		truncate: 120,
		symbols: false
	});
}

export const list_playlists = query(list_playlists_schema, async (input) => {
	assert_admin_user();

	const search_text = input.search_text?.trim() || '';
	const page = Math.max(1, input.page || 1);
	const page_size = Math.min(100, Math.max(1, input.page_size || 25));
	const offset = (page - 1) * page_size;

	const where_clause =
		search_text.length > 0 ? ilike(playlist.title, `%${search_text}%`) : undefined;

	const total_rows = where_clause
		? await db
				.select({ total: sql<number>`count(*)` })
				.from(playlist)
				.where(where_clause)
		: await db.select({ total: sql<number>`count(*)` }).from(playlist);

	const total = Number(total_rows[0]?.total || 0);

	const items = await db.query.playlist.findMany({
		where: where_clause,
		with: { videos: { columns: { video_id: true } } },
		orderBy: [desc(playlist.created_at)],
		limit: page_size,
		offset
	});

	return {
		items,
		total,
		page,
		page_size,
		total_pages: Math.max(1, Math.ceil(total / page_size))
	};
});

export const get_playlist_detail = query(v.string(), async (playlist_id) => {
	assert_admin_user();

	return db.query.playlist.findFirst({
		where: eq(playlist.id, playlist_id),
		with: {
			videos: {
				with: {
					video: {
						with: {
							meta: true
						}
					}
				},
				orderBy: (playlist_video, { asc }) => [asc(playlist_video.order)]
			}
		}
	});
});

export const create_playlist = command(create_playlist_schema, async (input) => {
	assert_admin_user();

	const normalized_slug = normalize_slug(input.title);
	if (!normalized_slug) {
		error(400, 'Unable to generate slug from title. Please provide a valid title.');
	}

	const existing_slug = await db.query.playlist.findFirst({
		where: eq(playlist.slug, normalized_slug),
		columns: { id: true }
	});

	if (existing_slug) {
		error(409, 'Slug already exists');
	}

	const new_id = randomUUID();

	await db.insert(playlist).values({
		id: new_id,
		title: input.title,
		slug: normalized_slug
	});

	return { id: new_id };
});

export const update_playlist = command(update_playlist_schema, async (input) => {
	assert_admin_user();

	const normalized_slug = normalize_slug(input.slug);
	if (!normalized_slug) {
		error(400, 'Slug is invalid');
	}

	const existing_playlist = await db.query.playlist.findFirst({
		where: eq(playlist.id, input.id),
		columns: { id: true }
	});

	if (!existing_playlist) {
		error(404, 'Playlist not found');
	}

	const duplicate_slug = await db.query.playlist.findFirst({
		where: and(eq(playlist.slug, normalized_slug), ne(playlist.id, input.id)),
		columns: { id: true }
	});

	if (duplicate_slug) {
		error(409, 'Slug already exists');
	}

	await db
		.update(playlist)
		.set({
			title: input.title,
			slug: normalized_slug
		})
		.where(eq(playlist.id, input.id));

	return { success: true };
});

export const delete_playlist = command(v.string(), async (playlist_id) => {
	assert_admin_user();

	const existing_playlist = await db.query.playlist.findFirst({
		where: eq(playlist.id, playlist_id),
		columns: { id: true }
	});

	if (!existing_playlist) {
		error(404, 'Playlist not found');
	}

	await db.delete(playlist).where(eq(playlist.id, playlist_id));

	return { success: true };
});

export const add_video_to_playlist = command(playlist_video_schema, async (input) => {
	assert_admin_user();

	const max_order_rows = await db
		.select({ max_order: sql<number | null>`max(${playlistOnVideo.order})` })
		.from(playlistOnVideo)
		.where(eq(playlistOnVideo.playlist_id, input.playlist_id));

	const current_max = Number(max_order_rows[0]?.max_order ?? -1);
	const next_order = Number.isFinite(current_max) ? current_max + 1 : 0;

	await db
		.insert(playlistOnVideo)
		.values({
			playlist_id: input.playlist_id,
			video_id: input.video_id,
			order: next_order
		})
		.onConflictDoNothing();

	return { success: true };
});

export const remove_video_from_playlist = command(playlist_video_schema, async (input) => {
	assert_admin_user();

	await db
		.delete(playlistOnVideo)
		.where(
			and(
				eq(playlistOnVideo.playlist_id, input.playlist_id),
				eq(playlistOnVideo.video_id, input.video_id)
			)
		);

	return { success: true };
});

export const search_videos_for_playlist = query(search_videos_schema, async (input) => {
	assert_admin_user();

	const search_text = input.search_text?.trim() || '';

	const attached_video_ids = db
		.select({ video_id: playlistOnVideo.video_id })
		.from(playlistOnVideo)
		.where(eq(playlistOnVideo.playlist_id, input.playlist_id));

	const where_clauses = [notInArray(video.id, attached_video_ids)];

	if (search_text.length > 0) {
		where_clauses.push(ilike(content.title, `%${search_text}%`));
	}

	const rows = await db
		.select({
			id: video.id,
			title: content.title,
			slug: content.slug,
			url: video.url,
			published_at: video.published_at
		})
		.from(video)
		.innerJoin(content, eq(content.id, video.content_id))
		.where(and(...where_clauses))
		.orderBy(desc(video.published_at), asc(content.title))
		.limit(25);

	return rows;
});
