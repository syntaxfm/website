import { command, getRequestEvent, query } from '$app/server';
import { db } from '$server/db/client';
import { article, content, role, show, showToUser, user, userRole } from '$server/db/schema';
import { error } from '@sveltejs/kit';
import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import * as v from 'valibot';

const user_role_schema = v.object({
	user_id: v.string(),
	role_id: v.string()
});

const list_users_schema = v.object({
	search_text: v.optional(v.string()),
	page: v.optional(v.number()),
	page_size: v.optional(v.number())
});

const bulk_user_role_schema = v.object({
	user_ids: v.pipe(v.array(v.string()), v.minLength(1)),
	role_id: v.pipe(v.string(), v.minLength(1))
});

const create_role_schema = v.object({
	name: v.pipe(v.string(), v.trim(), v.minLength(1))
});

function assert_admin_user() {
	const event = getRequestEvent();
	if (!event.locals?.user?.roles?.includes('admin')) {
		error(403, 'Admin access required');
	}
}

export const list_users = query(list_users_schema, async (input) => {
	assert_admin_user();

	const normalized_search = input.search_text?.trim() || '';
	const page = Math.max(1, input.page || 1);
	const page_size = Math.min(100, Math.max(1, input.page_size || 25));
	const offset = (page - 1) * page_size;

	const where_clause = normalized_search
		? or(
				ilike(user.username, `%${normalized_search}%`),
				ilike(user.name, `%${normalized_search}%`),
				ilike(user.email, `%${normalized_search}%`)
			)
		: undefined;

	const total_rows = where_clause
		? await db
				.select({ total: sql<number>`count(*)` })
				.from(user)
				.where(where_clause)
		: await db.select({ total: sql<number>`count(*)` }).from(user);

	const total = Number(total_rows[0]?.total || 0);

	const items = await db.query.user.findMany({
		where: where_clause,
		with: {
			roles: {
				with: {
					role: true
				}
			}
		},
		orderBy: (user_item, { asc }) => [asc(user_item.username)],
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
});

export const get_user_detail = query(v.string(), async (user_id) => {
	assert_admin_user();

	const result = await db.query.user.findFirst({
		where: eq(user.id, user_id),
		with: {
			roles: {
				with: {
					role: true
				}
			}
		}
	});

	if (!result) {
		return null;
	}

	const shows_hosted = await db
		.select({
			number: show.number,
			slug: show.slug,
			title: show.title,
			date: show.date
		})
		.from(showToUser)
		.innerJoin(show, eq(show.id, showToUser.show_id))
		.where(eq(showToUser.user_id, user_id))
		.orderBy(desc(show.date));

	const articles_authored = await db
		.select({
			id: content.id,
			title: content.title,
			slug: content.slug,
			status: content.status,
			updated_at: content.updated_at,
			published_at: content.published_at
		})
		.from(article)
		.innerJoin(content, eq(content.id, article.content_id))
		.where(eq(article.author_id, user_id))
		.orderBy(desc(content.updated_at));

	return { ...result, shows_hosted, articles_authored };
});

export const list_roles = query(async () => {
	assert_admin_user();

	return db.query.role.findMany({
		orderBy: (role_item, { asc }) => [asc(role_item.name)]
	});
});

export const create_role = command(create_role_schema, async ({ name }) => {
	assert_admin_user();

	const [created_role] = await db.insert(role).values({ name }).returning();

	return created_role;
});

export const add_user_role = command(user_role_schema, async ({ user_id, role_id }) => {
	assert_admin_user();

	await db
		.insert(userRole)
		.values({
			user_id,
			role_id
		})
		.onConflictDoNothing();

	return { success: true };
});

export const remove_user_role = command(user_role_schema, async ({ user_id, role_id }) => {
	assert_admin_user();

	await db
		.delete(userRole)
		.where(and(eq(userRole.user_id, user_id), eq(userRole.role_id, role_id)));

	return { success: true };
});

export const bulk_assign_role = command(bulk_user_role_schema, async ({ user_ids, role_id }) => {
	assert_admin_user();

	if (user_ids.length === 0) {
		return { count: 0 };
	}

	const values = user_ids.map((user_id) => ({ user_id, role_id }));

	await db.insert(userRole).values(values).onConflictDoNothing();

	return { count: user_ids.length };
});

export const bulk_remove_role = command(bulk_user_role_schema, async ({ user_ids, role_id }) => {
	assert_admin_user();

	if (user_ids.length === 0) {
		return { success: true };
	}

	await db
		.delete(userRole)
		.where(and(inArray(userRole.user_id, user_ids), eq(userRole.role_id, role_id)));

	return { success: true };
});
