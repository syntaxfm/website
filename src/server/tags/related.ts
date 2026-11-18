import { sql } from 'drizzle-orm';
import { db } from '$server/db/client';

// Related episodes and videos: the ones sharing the most tags with an item. A shared library
// (Effect, Proxmox) says more than a shared topic (JavaScript), and a rare tag more than a common
// one, so each shared tag counts its kind's weight times how rare it is (inverse document
// frequency: ln(published items / items with the tag)).
export const LIBRARY_WEIGHT = 3;
export const TOPIC_WEIGHT = 1;

/**
 * The ids of the published episodes and videos most related to this content, best first (newer
 * first on ties). Items sharing no tags aren't included.
 */
export async function find_related_content_ids(content_id: string, limit: number) {
	// postgres-js resolves to the rows themselves
	const rows = await db.execute<{ id: string }>(sql`
		with mine as (
			select ct.tag_id, t.kind
			from content_tags ct
			join tags t on t.id = ct.tag_id
			where ct.content_id = ${content_id} and t.kind is not null
		),
		published as (
			select id, published_at
			from content
			where status = 'PUBLISHED'
				and type in ('PODCAST', 'VIDEO')
				and published_at <= now()
		),
		tag_counts as (
			select ct.tag_id, count(*)::float as items
			from content_tags ct
			join published p on p.id = ct.content_id
			where ct.tag_id in (select tag_id from mine)
			group by ct.tag_id
		)
		select p.id
		from content_tags ct
		join mine m on m.tag_id = ct.tag_id
		join tag_counts tc on tc.tag_id = ct.tag_id
		join published p on p.id = ct.content_id
		where ct.content_id <> ${content_id}
		group by p.id, p.published_at
		order by
			sum(
				-- Parameters arrive as text, so the weights are cast
				(case when m.kind = 'LIBRARY' then ${LIBRARY_WEIGHT}::float else ${TOPIC_WEIGHT}::float end)
				* ln((select count(*) from published)::float / tc.items)
			) desc,
			p.published_at desc
		limit ${limit}
	`);
	return rows.map((row) => row.id);
}
