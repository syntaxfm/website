export const load = async function ({ locals, params }) {
	const { p_slug } = params;
	const playlist = await locals.prisma.playlist.findUnique({
		where: { slug: p_slug },
		include: {
			playlist_items: {
				include: {
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
