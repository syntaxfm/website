import { error } from '@sveltejs/kit';
import { and, asc, desc, eq, ilike, inArray, isNull, lte, or, sql } from 'drizzle-orm';

import { assert_admin_actor, is_admin, type Actor } from '$server/auth/authorization';
import { db } from '$server/db/client';
import { content, content_tags, tag } from '$server/db/schema';
import { normalize_slug } from '$utilities/normalize_slug';

// Tags: the site's curated topics. The admin Tags page (admin_tags.remote.ts) and the MCP endpoint
// (server/mcp) both call these with the person acting, so the rules live here once.

const TAG_DETAIL_LIMIT = 100;
const TAG_SLUG_MAX_LENGTH = 64;

// TOPIC and LIBRARY are the tag engine's kinds (src/server/tags); LEGACY is a tag from before it
export const TAG_KIND_FILTERS = ['TOPIC', 'LIBRARY', 'LEGACY'] as const;

export type TagKind = 'TOPIC' | 'LIBRARY';
export type TagKindFilter = (typeof TAG_KIND_FILTERS)[number];

export interface ListTagsInput {
	search_text?: string;
	kind?: TagKindFilter;
	page?: number;
	page_size?: number;
}

export interface CreateTagInput {
	name: string;
	slug?: string;
	kind?: TagKind;
}

export interface UpdateTagInput {
	id: string;
	name: string;
	slug?: string;
	// A topic's meaning, read by the model that tags content. Left out: unchanged.
	description?: string | null;
}

// Tag names are public (every tag page shows one), so anyone signed in may list them
export async function list_tags(_actor: Actor, input: ListTagsInput) {
	const search_text = input.search_text?.trim() || '';
	const page = Math.max(1, input.page || 1);
	const page_size = Math.min(100, Math.max(1, input.page_size || 25));
	const offset = (page - 1) * page_size;

	const where_clause = and(
		search_text
			? or(ilike(tag.name, `%${search_text}%`), ilike(tag.slug, `%${search_text}%`))
			: undefined,
		input.kind === 'LEGACY' ? isNull(tag.kind) : input.kind ? eq(tag.kind, input.kind) : undefined
	);

	const total_rows = await db
		.select({ total: sql<number>`count(*)` })
		.from(tag)
		.where(where_clause);

	const total = Number(total_rows[0]?.total || 0);

	const items = await db
		.select({
			id: tag.id,
			name: tag.name,
			slug: tag.slug,
			kind: tag.kind,
			description: tag.description,
			content_count: sql<number>`count(${content_tags.content_id})`
		})
		.from(tag)
		.leftJoin(content_tags, eq(tag.id, content_tags.tag_id))
		.where(where_clause)
		.groupBy(tag.id)
		.orderBy(asc(tag.name))
		.limit(page_size)
		.offset(offset);

	return {
		items: items.map((row) => ({
			id: row.id,
			name: row.name,
			slug: row.slug ?? '',
			kind: row.kind,
			description: row.description ?? '',
			content_count: Number(row.content_count)
		})),
		total,
		page,
		page_size,
		total_pages: Math.max(1, Math.ceil(total / page_size))
	};
}

/**
 * A tag and its newest content. Admins see every item; anyone else only what the site has
 * released (published, and not dated in the future), as the tag's public page shows.
 */
export async function get_tag_detail(actor: Actor, tag_id: string) {
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

	const visible_clause = is_admin(actor)
		? eq(content_tags.tag_id, tag_id)
		: and(
				eq(content_tags.tag_id, tag_id),
				eq(content.status, 'PUBLISHED'),
				lte(content.published_at, new Date())
			);

	const total_rows = await db
		.select({ total: sql<number>`count(*)` })
		.from(content_tags)
		.innerJoin(content, eq(content_tags.content_id, content.id))
		.where(visible_clause);

	const total_content_count = Number(total_rows[0]?.total || 0);

	const page_ids = await db
		.select({ id: content.id, updated_at: content.updated_at })
		.from(content_tags)
		.innerJoin(content, eq(content_tags.content_id, content.id))
		.where(visible_clause)
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
}

export async function create_tag(actor: Actor, input: CreateTagInput) {
	assert_admin_actor(actor);

	const normalized_slug = normalize_slug(input.slug?.trim() || input.name, TAG_SLUG_MAX_LENGTH);
	if (!normalized_slug) {
		error(400, 'Tag slug is invalid');
	}

	const [created_tag] = await db
		.insert(tag)
		.values({
			name: input.name,
			slug: normalized_slug,
			kind: input.kind ?? null
		})
		.returning();

	return created_tag;
}

export async function update_tag(actor: Actor, input: UpdateTagInput) {
	assert_admin_actor(actor);

	const normalized_slug = normalize_slug(input.slug?.trim() || input.name, TAG_SLUG_MAX_LENGTH);
	if (!normalized_slug) {
		error(400, 'Tag slug is invalid');
	}

	await db
		.update(tag)
		.set({
			name: input.name,
			slug: normalized_slug,
			...(input.description === undefined ? {} : { description: input.description || null })
		})
		.where(eq(tag.id, input.id));

	return { success: true };
}
