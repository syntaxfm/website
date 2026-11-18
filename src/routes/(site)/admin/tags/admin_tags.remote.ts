import { command, query } from '$app/server';
import { assert_admin } from '$server/auth/request_auth';
import { db } from '$server/db/client';
import { tag } from '$server/db/schema';
import * as tags from '$server/tags/tags';
import { eq, ilike } from 'drizzle-orm';
import * as v from 'valibot';

const create_tag_schema = v.object({
	name: v.pipe(v.string(), v.trim(), v.minLength(1)),
	slug: v.optional(v.string()),
	kind: v.optional(v.picklist(['TOPIC', 'LIBRARY']))
});

const update_tag_schema = v.object({
	id: v.string(),
	name: v.pipe(v.string(), v.trim(), v.minLength(1)),
	slug: v.optional(v.string()),
	// A topic's meaning, read by the model that tags content
	description: v.optional(v.nullable(v.pipe(v.string(), v.trim())))
});

const search_tag_schema = v.object({
	search_text: v.optional(v.string())
});

const list_tags_schema = v.object({
	search_text: v.optional(v.string()),
	kind: v.optional(v.picklist(tags.TAG_KIND_FILTERS)),
	page: v.optional(v.number()),
	page_size: v.optional(v.number())
});

export const list_tags = query(list_tags_schema, async (input) =>
	tags.list_tags(await assert_admin(), input)
);

export const get_tag_detail = query(v.string(), async (tag_id) =>
	tags.get_tag_detail(await assert_admin(), tag_id)
);

export const search_tags = query(search_tag_schema, async ({ search_text }) => {
	await assert_admin();

	const normalized_search = search_text?.trim() || '';

	return db.query.tag.findMany({
		where: normalized_search ? ilike(tag.name, `%${normalized_search}%`) : undefined,
		orderBy: (tag_item, { asc }) => [asc(tag_item.name)],
		limit: 25
	});
});

export const create_tag = command(create_tag_schema, async (input) =>
	tags.create_tag(await assert_admin(), input)
);

export const update_tag = command(update_tag_schema, async (input) =>
	tags.update_tag(await assert_admin(), input)
);

export const delete_tag = command(v.string(), async (tag_id) => {
	await assert_admin();

	await db.delete(tag).where(eq(tag.id, tag_id));

	return { success: true };
});
