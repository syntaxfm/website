import { prisma_client } from '$/server/prisma-client';

export const load = async function () {
	const playlists = await prisma_client.playlist.findMany({
		orderBy: {
			created_at: 'desc'
		},
		include: {
			videos: {
				take: 3,
				orderBy: {
					order: 'asc'
				},
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

	const playlists_with_item_count = playlists.map((playlist) => ({
		...playlist,
		item_count: playlist._count.videos
	}));
	return {
		playlists: playlists_with_item_count
	};
};
