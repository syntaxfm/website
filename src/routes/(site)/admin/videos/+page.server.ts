export const load = async ({ locals }) => {
	const local_playlists = await locals.prisma.playlist.findMany({
		orderBy: {
			created_at: 'desc'
		},
		include: {
			videos: true
		}
	});

	const playlists_with_item_count = local_playlists.map((playlist) => ({
		...playlist,
		item_count: playlist.videos.length
	}));

	return {
		local_playlists: playlists_with_item_count
	};
};
