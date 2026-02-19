import { command, getRequestEvent, query } from '$app/server';
import { db } from '$server/db/client';
import { content_tags, tag } from '$server/db/schema';
import { error } from '@sveltejs/kit';
import { asc, eq, ilike, sql } from 'drizzle-orm';
import * as v from 'valibot';
import get_slug from 'speakingurl';

const create_tag_schema = v.object({
	name: v.pipe(v.string(), v.trim(), v.minLength(1)),
	slug: v.optional(v.string())
});

const update_tag_schema = v.object({
	id: v.string(),
	name: v.pipe(v.string(), v.trim(), v.minLength(1)),
	slug: v.optional(v.string())
});

const search_tag_schema = v.object({
	search_text: v.optional(v.string())
});

function assert_admin_user() {
	const event = getRequestEvent();
	if (!event.locals?.user?.roles?.includes('admin')) {
		error(403, 'Admin access required');
	}
}

function normalize_slug(input_text: string) {
	return get_slug(input_text, {
		separator: '-',
		truncate: 64,
		symbols: false
	});
}

export const list_tags = query(async () => {
	assert_admin_user();

	return db
		.select({
			id: tag.id,
			name: tag.name,
			slug: tag.slug,
			content_count: sql<number>`count(${content_tags.content_id})`
		})
		.from(tag)
		.leftJoin(content_tags, eq(tag.id, content_tags.tag_id))
		.groupBy(tag.id)
		.orderBy(asc(tag.name));
});

export const search_tags = query(search_tag_schema, async ({ search_text }) => {
	assert_admin_user();

	const normalized_search = search_text?.trim() || '';

	return db.query.tag.findMany({
		where: normalized_search ? ilike(tag.name, `%${normalized_search}%`) : undefined,
		orderBy: (tag_item, { asc }) => [asc(tag_item.name)],
		limit: 25
	});
});

export const create_tag = command(create_tag_schema, async (input) => {
	assert_admin_user();

	const normalized_slug = normalize_slug(input.slug?.trim() || input.name);
	if (!normalized_slug) {
		error(400, 'Tag slug is invalid');
	}

	const [created_tag] = await db
		.insert(tag)
		.values({
			name: input.name,
			slug: normalized_slug
		})
		.returning();

	return created_tag;
});

export const update_tag = command(update_tag_schema, async (input) => {
	assert_admin_user();

	const normalized_slug = normalize_slug(input.slug?.trim() || input.name);
	if (!normalized_slug) {
		error(400, 'Tag slug is invalid');
	}

	await db
		.update(tag)
		.set({
			name: input.name,
			slug: normalized_slug
		})
		.where(eq(tag.id, input.id));

	return { success: true };
});

export const delete_tag = command(v.string(), async (tag_id) => {
	assert_admin_user();

	await db.delete(tag).where(eq(tag.id, tag_id));

	return { success: true };
});
