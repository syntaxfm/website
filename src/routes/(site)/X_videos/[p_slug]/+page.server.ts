import { db } from '$server/db/client';
import { playlists } from '$server/db/schema';
import { eq } from 'drizzle-orm';

export const load = async function ({ params }) {
	const { p_slug } = params;
	const playlist = await db.query.playlists.findFirst({
		where: eq(playlists.slug, p_slug),
		with: {
			videos: {
				with: {
					video: true
				}
			}
		}
	});

	if (!playlist) {
		// Playlist not found
		return {
			status: 404,
			error: 'Playlist not found'
		};
	}

	return {
		playlist
	};
};
