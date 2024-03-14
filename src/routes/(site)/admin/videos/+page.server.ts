export const load = async ({ locals }) => {
	const local_playlists = await locals.prisma.playlist.findMany({
		orderBy: {
			created_at: 'desc'
		},
		include: {
			playlist_items: true
		}
	});

	const playlists_with_item_count = local_playlists.map((playlist) => ({
		...playlist,
		item_count: playlist.playlist_items.length
	}));

	return {
		local_playlists: playlists_with_item_count
	};
};
