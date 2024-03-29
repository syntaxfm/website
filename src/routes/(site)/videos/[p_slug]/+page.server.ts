import playlistOrderBy from '$/lib/videos/playlistOrderBy.js';

export const load = async function ({ locals, params }) {
	const { p_slug } = params;
	const playlistMeta = await locals.prisma.playlist.findUnique({
		where: { slug: p_slug },
		select: {
			id: true,
			order: true
		}
	});

	if (!playlistMeta) {
		// Playlist not found
		return {
			status: 404,
			error: 'Playlist not found'
		};
	}

	const playlist = await locals.prisma.playlist.findUnique({
		where: {
			id: playlistMeta.id
		},
		include: {
			videos: {
				include: {
					video: true
				},
				orderBy: playlistOrderBy[playlistMeta.order]
			}
		}
	});

	return {
		playlist
	};
};
