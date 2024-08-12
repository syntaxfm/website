import { prisma_client } from '$/server/prisma-client';

export const load = async () => {
	const local_playlists = await prisma_client.playlist.findMany({
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
