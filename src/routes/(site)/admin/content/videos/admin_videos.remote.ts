import { command, query } from '$app/server';
import { db } from '$server/db/client';
import { playlist } from '$server/db/schema';
import { get_youtube_playlists, import_youtube_playlist } from '$server/video/youtube_api';
import { eq } from 'drizzle-orm';
import * as v from 'valibot';

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
