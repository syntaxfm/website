import { processor } from '$/utilities/markdown.js';
export const load = async function ({ locals, params }) {
	const { v_slug } = params;
	const video = await locals.prisma.video.findUnique({
		where: { slug: v_slug },
		include: {
			playlist_items: {
				include: {
					video: true
				}
			}
		}
	});

	if (!video) {
		// Playlist not found
		return {
			status: 404,
			error: 'Video not found'
		};
	}

	const desc = await processor.process(video?.description || '');

	return {
		video: {
			...video,
			description: desc.toString()
		}
	};
};
