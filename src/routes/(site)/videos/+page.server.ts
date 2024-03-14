export const load = async function ({ locals }) {
	const playlists = await locals.prisma.playlist.findMany({
		orderBy: {
			created_at: 'desc'
		},
		include: {
			playlist_items: {
				take: 3,
				orderBy: {
					order: 'asc'
				},
				include: {
					video: true
				}
			}
		}
	});

	const playlists_with_item_count = playlists.map((playlist) => ({
		...playlist,
		item_count: playlist.playlist_items.length
	}));
	return {
		playlists: playlists_with_item_count
	};
};
