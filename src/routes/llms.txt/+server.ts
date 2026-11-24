import type { RequestHandler } from '@sveltejs/kit';
import { PUBLIC_URL } from '$app/env/public';
import { and, count, desc, eq, isNotNull } from 'drizzle-orm';
import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';
import { content, content_tags, show, tag } from '$server/db/schema';
import { llms_txt } from '#lib/seo/llms_txt.ts';
import {
	has_show_number,
	released_content_clause,
	released_show_clause
} from '$server/content/released';

const LATEST_EPISODE_COUNT = 50;
const TOPIC_COUNT = 50;

// Three queries (~100 ms each from the Worker), and the answer only changes when a show is
// released, so the rows are edge cached.
async function load_llms_rows() {
	const released = released_show_clause();
	const [episode_count, latest, topics] = await Promise.all([
		db.$count(show, released),
		db.query.show.findMany({
			columns: { number: true, title: true, slug: true },
			where: released,
			orderBy: [desc(show.number)],
			limit: LATEST_EPISODE_COUNT,
			with: {
				aiShowNote: { columns: { description: true } },
				transcript: { columns: { id: true } }
			}
		}),
		db
			.select({ name: tag.name, slug: tag.slug, count: count(content_tags.content_id) })
			.from(tag)
			.innerJoin(content_tags, eq(content_tags.tag_id, tag.id))
			.innerJoin(content, eq(content.id, content_tags.content_id))
			.where(and(released_content_clause(), isNotNull(tag.slug)))
			.groupBy(tag.id)
			.orderBy(desc(count(content_tags.content_id)))
			.limit(TOPIC_COUNT)
	]);

	return {
		episode_count,
		latest_episodes: latest.filter(has_show_number).map((episode) => ({
			number: episode.number,
			title: episode.title,
			slug: episode.slug,
			description: episode.aiShowNote?.description ?? null,
			has_transcript: Boolean(episode.transcript)
		})),
		topics: topics.flatMap((topic) => (topic.slug ? [{ ...topic, slug: topic.slug }] : []))
	};
}

export const GET: RequestHandler = async function GET({ setHeaders }) {
	const rows = await edge_cached(
		'llms-txt-rows-2',
		{ fresh_seconds: 60 * 60, stale_seconds: 60 * 60 * 24 },
		load_llms_rows
	);

	setHeaders({
		'cache-control': 'max-age=0, s-maxage=3600',
		'content-type': 'text/plain; charset=utf-8'
	});

	return new Response(llms_txt({ site_url: `https://${PUBLIC_URL}`, ...rows }));
};
