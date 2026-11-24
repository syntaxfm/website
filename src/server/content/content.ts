import { and, desc, eq, gte, ilike, inArray, lte, sql } from 'drizzle-orm';

import { assert_admin_actor, is_admin, type Actor } from '$server/auth/authorization';
import { db } from '$server/db/client';
import { content, content_tags, type content_status, type content_types } from '$server/db/schema';
import { parse_optional_iso_date } from '$utilities/parse_optional_iso_date';
import { released_content_clause } from './released';
import { assert_episodes_can_publish } from '$server/shows/episode_publishing';

// Content: the wrapper for every content type (docs/CONTEXT.md). The admin Content pages
// (admin_content.remote.ts) and the MCP endpoint (server/mcp) both call these with the person
// acting, so the rules live here once.

type ContentStatus = (typeof content_status.enumValues)[number];
type ContentType = (typeof content_types.enumValues)[number];

export interface ListContentInput {
	search_text?: string;
	status?: ContentStatus | 'ALL';
	type?: ContentType | 'ALL';
	date_from_iso?: string;
	date_to_iso?: string;
	tag_id?: string;
	page?: number;
	page_size?: number;
}

export interface BulkContentStatusInput {
	content_ids: string[];
	status: ContentStatus;
}

export interface BulkContentTagsInput {
	content_ids: string[];
	tag_ids: string[];
}

/**
 * One page of content, newest first. Admins see every status; anyone else only released content,
 * whatever status they ask for.
 */
export async function list_content(actor: Actor, input: ListContentInput) {
	const search_text = input.search_text?.trim() || '';
	const status = input.status || 'ALL';
	const type = input.type || 'ALL';
	const page = Math.max(1, input.page || 1);
	const page_size = Math.min(100, Math.max(1, input.page_size || 25));
	const offset = (page - 1) * page_size;

	const where_clauses = [];

	if (!is_admin(actor)) {
		where_clauses.push(released_content_clause());
	}

	if (search_text.length > 0) {
		where_clauses.push(ilike(content.title, `%${search_text}%`));
	}

	if (status !== 'ALL') {
		where_clauses.push(eq(content.status, status));
	}

	if (type !== 'ALL') {
		where_clauses.push(eq(content.type, type));
	}

	const date_from = parse_optional_iso_date(input.date_from_iso);
	if (date_from) {
		where_clauses.push(gte(content.published_at, date_from));
	}

	const date_to = parse_optional_iso_date(input.date_to_iso);
	if (date_to) {
		where_clauses.push(lte(content.published_at, date_to));
	}

	const tag_id = input.tag_id?.trim() || '';
	if (tag_id.length > 0) {
		where_clauses.push(
			inArray(
				content.id,
				db
					.select({ id: content_tags.content_id })
					.from(content_tags)
					.where(eq(content_tags.tag_id, tag_id))
			)
		);
	}

	const where_clause = where_clauses.length > 0 ? and(...where_clauses) : undefined;

	const total_rows = where_clause
		? await db
				.select({ total: sql<number>`count(*)` })
				.from(content)
				.where(where_clause)
		: await db.select({ total: sql<number>`count(*)` }).from(content);

	const total = Number(total_rows[0]?.total || 0);

	const items = await db.query.content.findMany({
		where: where_clause,
		with: {
			show: true,
			video: true,
			article: true,
			tags: {
				with: {
					tag: true
				}
			}
		},
		orderBy: [desc(content.published_at), desc(content.updated_at)],
		limit: page_size,
		offset
	});

	return {
		items,
		total,
		page,
		page_size,
		total_pages: Math.max(1, Math.ceil(total / page_size))
	};
}

/** One content item with its type's row and tags; anyone but an admin only sees released content. */
export async function get_content_detail(actor: Actor, content_id: string) {
	return db.query.content.findFirst({
		where: is_admin(actor)
			? eq(content.id, content_id)
			: and(eq(content.id, content_id), released_content_clause()),
		with: {
			article: {
				with: {
					author: true
				}
			},
			show: true,
			video: true,
			tags: {
				with: {
					tag: true
				}
			}
		}
	});
}

/**
 * Sets the status of several content items. Publishing keeps an item's date (or dates it now);
 * returning one to draft clears its date. Archiving is how an item leaves the site.
 */
export async function bulk_update_status(actor: Actor, input: BulkContentStatusInput) {
	assert_admin_actor(actor);
	if (input.status === 'PUBLISHED') await assert_episodes_can_publish(input.content_ids);

	const set_values: {
		status: ContentStatus;
		updated_at: Date;
		published_at?: Date | null | ReturnType<typeof sql>;
	} = {
		status: input.status,
		updated_at: new Date()
	};

	if (input.status === 'PUBLISHED') {
		set_values.published_at = sql`coalesce(${content.published_at}, now())`;
	}

	if (input.status === 'DRAFT') {
		set_values.published_at = null;
	}

	await db.update(content).set(set_values).where(inArray(content.id, input.content_ids));

	return {
		success: true,
		count: input.content_ids.length
	};
}

/** Adds every tag to every content item; pairs that already exist are left alone. */
export async function assign_content_tags(actor: Actor, input: BulkContentTagsInput) {
	assert_admin_actor(actor);

	const values = input.content_ids.flatMap((content_id) =>
		input.tag_ids.map((tag_id) => ({
			content_id,
			tag_id
		}))
	);

	await db.insert(content_tags).values(values).onConflictDoNothing();

	return { success: true, count: values.length };
}

/** Takes every tag off every content item. The tags themselves stay. */
export async function remove_content_tags(actor: Actor, input: BulkContentTagsInput) {
	assert_admin_actor(actor);

	await db
		.delete(content_tags)
		.where(
			and(
				inArray(content_tags.content_id, input.content_ids),
				inArray(content_tags.tag_id, input.tag_ids)
			)
		);

	return { success: true };
}
