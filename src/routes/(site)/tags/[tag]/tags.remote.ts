import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { and, desc, eq, lte, sql } from 'drizzle-orm';
import { query } from '$app/server';
import { db } from '$server/db/client';
import {
	aiShowNote,
	aiSummaryEntry,
	content,
	content_tags,
	show,
	tag,
	transcript
} from '$server/db/schema';
import { edge_cached } from '$server/edge_cache';
import { feed_card_query } from '#lib/feed/feed_queries.ts';
import { pick_key_moments, whole_word_pattern, type KeyMomentRow } from '#lib/seo/hubs.ts';

// Moments are picked one per episode from the newest matches, so a handful of rows is plenty
const KEY_MOMENT_LIMIT = 6;
const KEY_MOMENT_CANDIDATES = 60;

// Transcript topics (AI summary entries) that name the tag, in this tag's released episodes that
// have a transcript, newest episode first
function find_key_moments(slug: string, name: string): Promise<KeyMomentRow[]> {
	return db
		.select({
			show_number: show.number,
			show_slug: show.slug,
			show_title: show.title,
			time: aiSummaryEntry.time,
			text: aiSummaryEntry.text
		})
		.from(tag)
		.innerJoin(content_tags, eq(content_tags.tag_id, tag.id))
		.innerJoin(content, eq(content.id, content_tags.content_id))
		.innerJoin(show, eq(show.content_id, content.id))
		.innerJoin(transcript, eq(transcript.show_number, show.number))
		.innerJoin(aiShowNote, eq(aiShowNote.show_number, show.number))
		.innerJoin(aiSummaryEntry, eq(aiSummaryEntry.show_note_id, aiShowNote.id))
		.where(
			and(
				eq(tag.slug, slug),
				eq(content.status, 'PUBLISHED'),
				lte(show.date, new Date()),
				sql`${aiSummaryEntry.text} ~* ${whole_word_pattern(name)}`
			)
		)
		.orderBy(desc(show.date), aiSummaryEntry.id)
		.limit(KEY_MOMENT_CANDIDATES);
}

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
			// Needs the tag's name, so it waits for the first two
			const key_moments = tag_row
				? pick_key_moments(await find_key_moments(slug, tag_row.name), KEY_MOMENT_LIMIT)
				: [];
			return { tag: tag_row ?? null, items, key_moments };
		}
	);

	if (!data.tag) error(404, 'Tag not found');
	return { tag: data.tag, items: data.items, key_moments: data.key_moments };
});
