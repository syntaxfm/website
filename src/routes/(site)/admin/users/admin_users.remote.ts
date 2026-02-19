import { command, getRequestEvent, query } from '$app/server';
import { db } from '$server/db/client';
import { role, user, userRole } from '$server/db/schema';
import { error } from '@sveltejs/kit';
import { and, asc, eq, ilike, or } from 'drizzle-orm';
import * as v from 'valibot';

const user_role_schema = v.object({
	user_id: v.string(),
	role_id: v.string()
});

const search_user_schema = v.object({
	search_text: v.optional(v.string())
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

export const list_users = query(search_user_schema, async ({ search_text }) => {
	assert_admin_user();

	const normalized_search = search_text?.trim() || '';

	return db.query.user.findMany({
		where: normalized_search
			? or(
					ilike(user.username, `%${normalized_search}%`),
					ilike(user.name, `%${normalized_search}%`),
					ilike(user.email, `%${normalized_search}%`)
				)
			: undefined,
		with: {
			roles: {
				with: {
					role: true
				}
			}
		},
		orderBy: (user_item, { asc }) => [asc(user_item.username)]
	});
});

export const get_user_detail = query(v.string(), async (user_id) => {
	assert_admin_user();

	return db.query.user.findFirst({
		where: eq(user.id, user_id),
		with: {
			roles: {
				with: {
					role: true
				}
			}
		}
	});
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
