import { db } from '$server/db/client';
import { videos } from '$server/db/schema';
import { eq } from 'drizzle-orm';
import { with_show_card_show } from '$server/shows/shows_queries';
import { get_first_paragraph } from '$utilities/get_first_paragraph';
import { processor } from '$utilities/markdown.js';

export const load = async function ({ params, url }) {
	const { v_slug } = params;

	const video = await db.query.videos.findFirst({
		where: eq(videos.slug, v_slug),
		with: {
			shows: {
				orderBy: (showVideos, { desc }) => [desc(showVideos.showId)],
				with: {
					show: with_show_card_show
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
		},
		meta: {
			title: video.title,
			url: `${url.protocol}//${url.host}${url.pathname}`,
			canonical: `${url.protocol}//${url.host}${url.pathname}`,
			description: get_first_paragraph(video?.description || '')
		}
	};
};
