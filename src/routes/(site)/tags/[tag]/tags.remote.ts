import { eq } from 'drizzle-orm';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { query } from '$app/server';
import { db } from '$server/db/client';
import { content_tags } from '$server/db/schema';

export const get_content_by_tag = query(v.string(), async (slug) => {
	const tag_row = await db.query.tag.findFirst({
		where: (t, { eq }) => eq(t.slug, slug)
	});

	if (!tag_row) {
		error(404, 'Tag not found');
	}

	const tagged = await db
		.select({ content_id: content_tags.content_id })
		.from(content_tags)
		.where(eq(content_tags.tag_id, tag_row.id));

	const content_ids = tagged.map((row) => row.content_id);

	const items = content_ids.length
		? await db.query.content.findMany({
				where: (c, { and, eq, inArray }) =>
					and(eq(c.status, 'PUBLISHED'), inArray(c.id, content_ids)),
				orderBy: (c, { desc }) => [desc(c.published_at)],
				with: {
					show: {
						with: {
							guests: { with: { guest: true } },
							hosts: true,
							aiShowNote: { with: { topics: true } }
						}
					},
					tags: { with: { tag: true } },
					article: true,
					video: true
				}
			})
		: [];

	return { tag: tag_row, items };
});
