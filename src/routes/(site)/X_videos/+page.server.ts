// TODO remove entirely
import { db } from '$server/db/client';
import { playlists, playlistsOnVideos } from '$server/db/schema';
import { desc, asc, sql } from 'drizzle-orm';

export const load = async function () {
	const playlistsData = await db.query.playlists.findMany({
		orderBy: [desc(playlists.created_at)],
		with: {
			videos: {
				limit: 3,
				orderBy: [asc(playlistsOnVideos.order)],
				with: {
					video: true
				}
			}
		},
		extras: {
			item_count:
				sql<number>`(SELECT COUNT(*) FROM ${playlistsOnVideos} WHERE ${playlistsOnVideos.playlist_id} = ${playlists.id})`.as(
					'item_count'
				)
		}
	});

	return {
		playlists: playlistsData
	};
};
