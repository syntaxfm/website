import { prisma_client } from '$/hooks.server';

export const load = async function ({ params }) {
	const { p_slug } = params;
	const playlist = await prisma_client.playlist.findUnique({
		where: { slug: p_slug },
		include: {
			videos: {
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
