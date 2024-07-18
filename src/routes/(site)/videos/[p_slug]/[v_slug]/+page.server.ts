import { prisma_client } from '$/hooks.server';
import { get_show_card_query } from '$/server/shows/shows_queries';
import { get_first_paragraph } from '$/utilities/get_first_paragraph';
import { processor } from '$/utilities/markdown.js';

export const load = async function ({ params, url }) {
	const { v_slug } = params;
	const show_card_query = get_show_card_query();
	const video = await prisma_client.video.findUnique({
		where: { slug: v_slug },
		include: {
			shows: { include: { show: show_card_query }, orderBy: { showId: 'desc' } }
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
