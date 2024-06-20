import { PlaylistOrder } from '@prisma/client';
import type { Actions } from '@sveltejs/kit';

export const load = async ({ params, locals }) => {
	const { playlist_id } = params;

	try {
		// Fetch the playlist details
		const playlist = await locals.prisma.playlist.findUnique({
			where: { id: playlist_id },
			include: {
				videos: {
					include: {
						video: true
					},
					orderBy: {
						order: 'asc'
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

		// Extract the video details from the playlist items
		const videos = playlist.videos.map((item) => item.video);
		console.log('videos', videos);

		const playlistOrderTypes = Object.keys(PlaylistOrder);

		return {
			playlist,
			videos,
			playlistOrderTypes
		};
	} catch (error) {
		console.error('Error fetching playlist videos:', error);
		return {
			status: 500,
			error: 'Internal Server Error'
		};
	}
};

export const actions: Actions = {
	updatePlaylist: async function updatePlaylist({ locals, params }) {
		const { playlist_id } = params;
		const { playlistOrder } = locals.form_data;
		if (!playlist_id || !playlistOrder) {
			return {
				error: 'Missing data',
				status: 500
			};
		}
		await locals.prisma.playlist.update({
			where: {
				id: playlist_id
			},
			data: {
				order: locals.form_data.playlistOrder as PlaylistOrder
			}
		});
		return {
			message: 'Updated'
		};
	}
};
