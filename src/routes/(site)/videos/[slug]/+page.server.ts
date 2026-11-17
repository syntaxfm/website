import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';
import { content } from '$server/db/schema';
import { read_video_description, to_iso_duration } from '#lib/videos/video_description.ts';
import type { PageServerLoad } from './$types';

// Meta descriptions past this get cut off in search results
const META_DESCRIPTION_LENGTH = 160;

// A YouTube video's page (synced by src/server/video/video_sync.ts), with YouTube's captions as
// its transcript. Edge cached like episode pages: new captions show within five minutes.
async function load_video_page(slug: string) {
	const row = await db.query.content.findFirst({
		where: and(eq(content.slug, slug), eq(content.type, 'VIDEO'), eq(content.status, 'PUBLISHED')),
		columns: { title: true, slug: true, published_at: true, updated_at: true },
		with: {
			video: {
				columns: {
					id: true,
					description: true,
					thumbnail: true,
					duration_seconds: true,
					view_count: true
				}
			},
			tags: { columns: {}, with: { tag: { columns: { name: true, slug: true } } } },
			transcript: {
				columns: {},
				with: {
					utterances: {
						columns: { start: true, transcript_value: true },
						orderBy: (utterance, { asc }) => [asc(utterance.start)]
					}
				}
			}
		}
	});
	if (!row?.video || !row.published_at) return null;

	return {
		youtube_id: row.video.id,
		slug: row.slug,
		title: row.title,
		published_at: row.published_at,
		updated_at: row.updated_at,
		thumbnail: row.video.thumbnail,
		duration_seconds: row.video.duration_seconds,
		view_count: row.video.view_count,
		description: read_video_description(row.video.description ?? ''),
		tags: row.tags.map(({ tag }) => tag),
		passages: (row.transcript?.utterances ?? []).map((utterance) => ({
			start: utterance.start,
			text: utterance.transcript_value
		}))
	};
}

export const load: PageServerLoad = async ({ params, url }) => {
	const video = await edge_cached(
		`video-page-${params.slug}`,
		{ fresh_seconds: 60 * 5, stale_seconds: 60 * 60 * 24 },
		() => load_video_page(params.slug)
	);
	if (!video) error(404, 'This video does not exist.');

	const canonical = `${url.origin}/videos/${video.slug}`;
	const summary = video.description.paragraphs.join(' ');
	return {
		video,
		meta: {
			title: `${video.title} - Syntax`,
			image: video.thumbnail,
			url: canonical,
			canonical,
			description:
				summary.length > META_DESCRIPTION_LENGTH
					? `${summary.slice(0, META_DESCRIPTION_LENGTH - 1).trimEnd()}…`
					: summary || undefined,
			published: new Date(video.published_at).toISOString(),
			modified: new Date(video.updated_at).toISOString()
		},
		duration: video.duration_seconds ? to_iso_duration(video.duration_seconds) : null
	};
};
