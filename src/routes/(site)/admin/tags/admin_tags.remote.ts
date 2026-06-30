import { command, getRequestEvent, query } from '$app/server';
import { db } from '$server/db/client';
import { content, content_tags, tag } from '$server/db/schema';
import { error } from '@sveltejs/kit';
import { asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import * as v from 'valibot';
import get_slug from 'speakingurl';

const TAG_DETAIL_LIMIT = 100;

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

const list_tags_schema = v.object({
	search_text: v.optional(v.string()),
	page: v.optional(v.number()),
	page_size: v.optional(v.number())
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

export const list_tags = query(list_tags_schema, async (input) => {
	assert_admin_user();

	const search_text = input.search_text?.trim() || '';
	const page = Math.max(1, input.page || 1);
	const page_size = Math.min(100, Math.max(1, input.page_size || 25));
	const offset = (page - 1) * page_size;

	const search_clause = search_text
		? or(ilike(tag.name, `%${search_text}%`), ilike(tag.slug, `%${search_text}%`))
		: undefined;

	const total_rows = search_clause
		? await db
				.select({ total: sql<number>`count(*)` })
				.from(tag)
				.where(search_clause)
		: await db.select({ total: sql<number>`count(*)` }).from(tag);

	const total = Number(total_rows[0]?.total || 0);

	const base_select = db
		.select({
			id: tag.id,
			name: tag.name,
			slug: tag.slug,
			content_count: sql<number>`count(${content_tags.content_id})`
		})
		.from(tag)
		.leftJoin(content_tags, eq(tag.id, content_tags.tag_id));

	const items = await (search_clause ? base_select.where(search_clause) : base_select)
		.groupBy(tag.id)
		.orderBy(asc(tag.name))
		.limit(page_size)
		.offset(offset);

	return {
		items: items.map((row) => ({
			id: row.id,
			name: row.name,
			slug: row.slug ?? '',
			content_count: Number(row.content_count)
		})),
		total,
		page,
		page_size,
		total_pages: Math.max(1, Math.ceil(total / page_size))
	};
});

export const get_tag_detail = query(v.string(), async (tag_id) => {
	assert_admin_user();

	const tag_row = await db.query.tag.findFirst({
		where: eq(tag.id, tag_id),
		columns: {
			id: true,
			name: true,
			slug: true
		}
	});

	if (!tag_row) {
		error(404, 'Tag not found');
	}

	const total_rows = await db
		.select({ total: sql<number>`count(*)` })
		.from(content_tags)
		.where(eq(content_tags.tag_id, tag_id));

	const total_content_count = Number(total_rows[0]?.total || 0);

	const page_ids = await db
		.select({ id: content.id, updated_at: content.updated_at })
		.from(content_tags)
		.innerJoin(content, eq(content_tags.content_id, content.id))
		.where(eq(content_tags.tag_id, tag_id))
		.orderBy(desc(content.updated_at))
		.limit(TAG_DETAIL_LIMIT);

	const content_ids = page_ids.map((row) => row.id);

	const items = content_ids.length
		? await db.query.content.findMany({
				where: inArray(content.id, content_ids),
				with: {
					show: true,
					video: true
				}
			})
		: [];

	const items_by_id = new Map(items.map((item) => [item.id, item]));
	const ordered_items = content_ids
		.map((content_id) => items_by_id.get(content_id))
		.filter((item): item is (typeof items)[number] => item !== undefined);

	return {
		tag: {
			id: tag_row.id,
			name: tag_row.name,
			slug: tag_row.slug ?? ''
		},
		items: ordered_items,
		total_content_count,
		limit: TAG_DETAIL_LIMIT
	};
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
