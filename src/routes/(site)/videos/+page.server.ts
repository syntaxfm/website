import playListOrderBy from '$lib/videos/playlistOrderBy';

export const load = async function ({ locals }) {
	const playlistMeta = await locals.prisma.playlist.findMany({
		orderBy: {
			created_at: 'desc'
		},
		select: {
			id: true,
			order: true
		}
	});
	const playlists = await Promise.all(
		playlistMeta.map(async (playlist) => {
			return locals.prisma.playlist.findFirst({
				where: {
					id: playlist.id
				},
				include: {
					videos: {
						take: 3,
						orderBy: playListOrderBy[playlist.order],
						include: {
							video: true
						}
					},
					_count: {
						select: {
							videos: true
						}
					}
				}
			});
		})
	);

	const playlists_with_item_count = playlists.map((playlist) => ({
		...playlist,
		item_count: playlist!._count.videos
	}));
	return {
		playlists: playlists_with_item_count
	};
};
