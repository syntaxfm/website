import { get_first_paragraph } from '$/utilities/get_first_paragraph';
import { processor } from '$/utilities/markdown.js';
export const load = async function ({ locals, params, url }) {
	const { v_slug } = params;
	const video = await locals.prisma.video.findUnique({
		where: { slug: v_slug },
		include: {
			shows: { include: { show: true }, orderBy: { showId: 'desc' } }
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
		},
		meta: {
			title: video.title,
			url: `${url.protocol}//${url.host}${url.pathname}`,
			canonical: `${url.protocol}//${url.host}${url.pathname}`,
			description: get_first_paragraph(video?.description || '')
		}
	};
};
