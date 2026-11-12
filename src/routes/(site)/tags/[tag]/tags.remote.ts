import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { query } from '$app/server';
import { db } from '$server/db/client';
import { content_tags, tag } from '$server/db/schema';
import { edge_cached } from '$server/edge_cache';
import { feed_card_query } from '#lib/feed/feed_queries.ts';

// Edge cached like the Home feed. The tag and its content are asked for at once: each query is
// a ~100 ms round trip to the database.
export const get_content_by_tag = query(v.string(), async (slug) => {
	const data = await edge_cached(
		`tag-feed-${slug}`,
		{ fresh_seconds: 60 * 5, stale_seconds: 60 * 60 * 24 },
		async () => {
			const [tag_row, items] = await Promise.all([
				db.query.tag.findFirst({
					columns: { name: true, slug: true },
					where: (t, { eq }) => eq(t.slug, slug)
				}),
				db.query.content.findMany({
					...feed_card_query,
					where: (c, { and, eq, inArray }) =>
						and(
							eq(c.status, 'PUBLISHED'),
							inArray(
								c.id,
								db
									.select({ id: content_tags.content_id })
									.from(content_tags)
									.innerJoin(tag, eq(tag.id, content_tags.tag_id))
									.where(eq(tag.slug, slug))
							)
						),
					orderBy: (c, { desc }) => [desc(c.published_at)]
				})
			]);
			return { tag: tag_row ?? null, items };
		}
	);

	if (!data.tag) error(404, 'Tag not found');
	return { tag: data.tag, items: data.items };
});
