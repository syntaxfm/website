import { command, getRequestEvent, query } from '$app/server';
import { db } from '$server/db/client';
import {
	content,
	content_tags,
	playlist,
	playlistOnVideo,
	showVideo,
	video
} from '$server/db/schema';
import { get_youtube_playlists, import_youtube_playlist } from '$server/video/youtube_api';
import { error } from '@sveltejs/kit';
import { and, asc, desc, eq, gte, ilike, lte, sql } from 'drizzle-orm';
import * as v from 'valibot';

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
	published_at_iso: v.optional(v.nullable(v.string()))
});

const delete_video_schema = v.object({
	content_id: v.pipe(v.string(), v.trim(), v.minLength(1)),
	confirm_text: v.string()
});

function assert_admin_user() {
	const event = getRequestEvent();
	if (!event.locals?.user?.roles?.includes('admin')) {
		error(403, 'Admin access required');
	}
	return event;
}

function parse_optional_iso_date(maybe_iso: string | null | undefined) {
	if (!maybe_iso) {
		return null;
	}

	const parsed_date = new Date(maybe_iso);
	if (Number.isNaN(parsed_date.getTime())) {
		return null;
	}

	return parsed_date;
}

// Queries
// ======================================================

export const get_all_videos = query(() => {
	return db.query.playlist.findMany({
		orderBy: (playlist, { desc }) => [desc(playlist.created_at)],
		with: {
			videos: true
		}
	});
});

export const list_videos = query(list_videos_schema, async (input) => {
	assert_admin_user();

	const search_text = input.search_text?.trim() || '';
	const status = input.status || 'ALL';
	const order = input.order || 'desc';
	const page = Math.max(1, input.page || 1);
	const page_size = Math.min(100, Math.max(1, input.page_size || 25));
	const offset = (page - 1) * page_size;

	const where_clauses = [eq(content.type, 'VIDEO' as const)];

	if (search_text.length > 0) {
		where_clauses.push(ilike(content.title, `%${search_text}%`));
	}

	if (status !== 'ALL') {
		where_clauses.push(eq(content.status, status));
	}

	const date_from = parse_optional_iso_date(input.date_from_iso);
	if (date_from) {
		where_clauses.push(gte(content.published_at, date_from));
	}

	const date_to = parse_optional_iso_date(input.date_to_iso);
	if (date_to) {
		where_clauses.push(lte(content.published_at, date_to));
	}

	const where_clause = and(...where_clauses);

	const total_rows = await db
		.select({ total: sql<number>`count(*)` })
		.from(video)
		.innerJoin(content, eq(content.id, video.content_id))
		.where(where_clause);

	const total = Number(total_rows[0]?.total || 0);

	const order_clause = order === 'asc' ? asc(content.published_at) : desc(content.published_at);

	const id_rows = await db
		.select({ id: video.id })
		.from(video)
		.innerJoin(content, eq(content.id, video.content_id))
		.where(where_clause)
		.orderBy(order_clause)
		.limit(page_size)
		.offset(offset);

	const video_ids = id_rows.map((row) => row.id);

	const fetched_items = video_ids.length
		? await db.query.video.findMany({
				where: (video_row, { inArray }) => inArray(video_row.id, video_ids),
				with: {
					meta: true
				}
			})
		: [];

	const items_by_id = new Map(fetched_items.map((video_item) => [video_item.id, video_item]));
	const items = id_rows
		.map((row) => items_by_id.get(row.id))
		.filter((video_item): video_item is (typeof fetched_items)[number] => video_item !== undefined);

	return {
		items,
		total,
		page,
		page_size,
		total_pages: Math.max(1, Math.ceil(total / page_size))
	};
});

export const get_remote_playlists = query(async () => {
	const playlist_data = await db.query.remotePlaylist.findMany({
		orderBy: (content, { desc }) => [desc(content.created_at)]
	});

	const local_playlists = await db.query.playlist.findMany({
		orderBy: (content, { desc }) => [desc(content.created_at)],
		columns: {
			id: true
		}
	});
	const playlist_ids = local_playlists.map((playlist) => playlist.id);
	return {
		playlists: playlist_data,
		local_playlists: playlist_ids
	};
});

export const get_playlist = query(v.string(), async (playlist_id) => {
	return db.query.playlist.findFirst({
		where: eq(playlist.id, playlist_id),
		with: {
			videos: {
				with: {
					video: true
				},
				orderBy: (content, { asc }) => [asc(content.order)]
			}
		}
	});
});

// Mutations
// ======================================================

export const import_remote_playlists = command(async () => {
	try {
		await get_youtube_playlists();
		return {
			message: 'Imported Playlists'
		};
	} catch (error) {
		console.error(error);
		return {
			success: false,
			message: 'Import/Sync Failed'
		};
	}
});

export const import_playlist = command(v.string(), async (playlist_id) => {
	try {
		await import_youtube_playlist(playlist_id);
		get_remote_playlists().refresh();
		return {
			message: 'Imported Playlist amd Videos'
		};
	} catch (error) {
		console.error(error);
		return {
			success: false,
			message: 'Import/Sync Failed'
		};
	}
});

export const update_video_meta = command(update_video_meta_schema, async (input) => {
	assert_admin_user();

	let next_published_at = parse_optional_iso_date(input.published_at_iso || null);
	if (input.status === 'PUBLISHED' && !next_published_at) {
		next_published_at = new Date();
	}

	const updated_rows = await db
		.update(content)
		.set({
			status: input.status,
			published_at: next_published_at,
			updated_at: new Date()
		})
		.where(and(eq(content.id, input.content_id), eq(content.type, 'VIDEO')))
		.returning({ id: content.id });

	if (updated_rows.length === 0) {
		error(404, 'Video not found');
	}

	return { success: true };
});

export const delete_video = command(delete_video_schema, async (input) => {
	assert_admin_user();

	if (input.confirm_text !== 'DELETE') {
		error(400, 'Type DELETE to confirm video deletion');
	}

	const target_content = await db.query.content.findFirst({
		where: eq(content.id, input.content_id),
		columns: {
			id: true,
			type: true
		}
	});

	if (!target_content) {
		error(404, 'Video not found');
	}

	if (target_content.type !== 'VIDEO') {
		error(400, 'Refusing to delete non-video content');
	}

	const linked_video = await db.query.video.findFirst({
		where: eq(video.content_id, input.content_id),
		columns: {
			id: true
		}
	});

	await db.transaction(async (tx) => {
		if (linked_video) {
			await tx.delete(playlistOnVideo).where(eq(playlistOnVideo.video_id, linked_video.id));
			await tx.delete(showVideo).where(eq(showVideo.video_id, linked_video.id));
			await tx.delete(video).where(eq(video.id, linked_video.id));
		}

		await tx.delete(content_tags).where(eq(content_tags.content_id, input.content_id));
		await tx.delete(content).where(eq(content.id, input.content_id));
	});

	return { deleted: true };
});
