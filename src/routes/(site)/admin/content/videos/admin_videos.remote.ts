import { command, getRequestEvent, query } from '$app/server';
import { db } from '$server/db/client';
import { content, playlist, video } from '$server/db/schema';
import { get_youtube_playlists, import_youtube_playlist } from '$server/video/youtube_api';
import { error } from '@sveltejs/kit';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import * as v from 'valibot';

const VIDEO_STATUS_FILTER_VALUES = ['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

const list_videos_schema = v.object({
	search_text: v.optional(v.string()),
	status: v.optional(v.picklist(VIDEO_STATUS_FILTER_VALUES)),
	page: v.optional(v.number()),
	page_size: v.optional(v.number())
});

function assert_admin_user() {
	const event = getRequestEvent();
	if (!event.locals?.user?.roles?.includes('admin')) {
		error(403, 'Admin access required');
	}
	return event;
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
	const page = Math.max(1, input.page || 1);
	const page_size = Math.min(100, Math.max(1, input.page_size || 25));
	const offset = (page - 1) * page_size;

	const where_clauses = [];

	if (search_text.length > 0) {
		where_clauses.push(ilike(content.title, `%${search_text}%`));
	}

	if (status !== 'ALL') {
		where_clauses.push(eq(content.status, status));
	}

	const join_filtered = where_clauses.length > 0;
	const where_clause = join_filtered ? and(...where_clauses) : undefined;

	const base_count = db
		.select({ total: sql<number>`count(*)` })
		.from(video)
		.$dynamic();

	const count_query = join_filtered
		? base_count.innerJoin(content, eq(content.id, video.content_id)).where(where_clause)
		: base_count;

	const total_rows = await count_query;
	const total = Number(total_rows[0]?.total || 0);

	const base_select = db
		.select({ id: video.id })
		.from(video)
		.$dynamic();

	const id_query = join_filtered
		? base_select.innerJoin(content, eq(content.id, video.content_id)).where(where_clause)
		: base_select;

	const id_rows = await id_query
		.orderBy(desc(video.published_at))
		.limit(page_size)
		.offset(offset);

	const video_ids = id_rows.map((row) => row.id);

	const items = video_ids.length
		? await db.query.video.findMany({
				where: (video_row, { inArray }) => inArray(video_row.id, video_ids),
				with: {
					meta: true
				},
				orderBy: [desc(video.published_at)]
			})
		: [];

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
