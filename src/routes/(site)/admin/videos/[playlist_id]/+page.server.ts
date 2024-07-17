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

		return {
			playlist,
			videos
		};
	} catch (error) {
		console.error('Error fetching playlist videos:', error);
		return {
			status: 500,
			error: 'Internal Server Error'
		};
	}
};
