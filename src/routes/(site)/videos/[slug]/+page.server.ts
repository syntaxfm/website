import { error, redirect } from '@sveltejs/kit';
import {
	find_video_destination,
	OLD_PLAYLIST_DESTINATION,
	OLD_PLAYLIST_SLUGS
} from '$server/video/old_video_urls';
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
		columns: { id: true, title: true, slug: true, published_at: true, updated_at: true },
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
						columns: { start: true, end: true, transcript_value: true },
						orderBy: (utterance, { asc }) => [asc(utterance.start)]
					}
				}
			}
		}
	});
	if (!row?.video || !row.published_at) return null;

	return {
		content_id: row.id,
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
		// Shaped for Transcript.svelte, like an episode's
		passages: (row.transcript?.utterances ?? []).map((utterance) => ({
			transcript: utterance.transcript_value,
			start: utterance.start,
			end: utterance.end
		}))
	};
}

export const load: PageServerLoad = async ({ params, url }) => {
	// Served stale for up to a day: change the key when the page's data changes shape
	const video = await edge_cached(
		`video-page-3-${params.slug}`,
		{ fresh_seconds: 60 * 5, stale_seconds: 60 * 60 * 24 },
		() => load_video_page(params.slug)
	);
	if (!video) {
		// An old playlist page (/videos/cj-syntax), or a video now known as an episode
		if (OLD_PLAYLIST_SLUGS.has(params.slug)) redirect(301, OLD_PLAYLIST_DESTINATION);
		const destination = await find_video_destination(params.slug);
		if (destination) redirect(301, destination);
		error(404, 'This video does not exist.');
	}

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
