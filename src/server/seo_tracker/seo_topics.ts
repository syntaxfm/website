import { count, eq, gte } from 'drizzle-orm';

import { db } from '$server/db/client';
import { content_tags, guest, tag } from '$server/db/schema';

// A tag counts as a Syntax topic (for "on topic" keywords) once this much content uses it
const MIN_TOPIC_CONTENT = 3;

/**
 * Syntax's topics and guests, so keyword lists keep "css scroll animations" and "jared palmer" and
 * drop the song lyrics the homepage ranks for. The SEO page and the SEO MCP tools both use it.
 */
export async function get_seo_topic_names(): Promise<string[]> {
	const [topic_rows, guest_rows] = await Promise.all([
		db
			.select({ name: tag.name })
			.from(tag)
			.innerJoin(content_tags, eq(content_tags.tag_id, tag.id))
			.groupBy(tag.id, tag.name)
			.having(gte(count(content_tags.content_id), MIN_TOPIC_CONTENT)),
		db.select({ name: guest.name }).from(guest)
	]);
	return [...topic_rows, ...guest_rows].map((row) => row.name);
}
