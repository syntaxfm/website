import { command, getRequestEvent, query } from '$app/server';
import { db } from '$server/db/client';
import { guest, socialLink } from '$server/db/schema';
import { error } from '@sveltejs/kit';
import { and, asc, eq, ilike, ne, sql } from 'drizzle-orm';
import * as v from 'valibot';
import get_slug from 'speakingurl';

const list_guests_schema = v.object({
	search_text: v.optional(v.string()),
	page: v.optional(v.number()),
	page_size: v.optional(v.number())
});

const create_guest_schema = v.object({
	name: v.pipe(v.string(), v.trim(), v.minLength(1))
});

const update_guest_schema = v.object({
	id: v.pipe(v.string(), v.trim(), v.minLength(1)),
	name: v.pipe(v.string(), v.trim(), v.minLength(1)),
	name_slug: v.pipe(v.string(), v.trim(), v.minLength(1)),
	twitter: v.optional(v.nullable(v.string())),
	github: v.optional(v.nullable(v.string())),
	url: v.optional(v.nullable(v.string())),
	of: v.optional(v.nullable(v.string()))
});

const delete_guest_schema = v.object({
	guest_id: v.pipe(v.string(), v.trim(), v.minLength(1)),
	confirm_text: v.string()
});

const add_social_link_schema = v.object({
	guest_id: v.pipe(v.string(), v.trim(), v.minLength(1)),
	link: v.pipe(v.string(), v.trim(), v.minLength(1))
});

const remove_social_link_schema = v.object({
	social_link_id: v.pipe(v.string(), v.trim(), v.minLength(1))
});

function assert_admin_user() {
	const event = getRequestEvent();
	if (!event.locals?.user?.roles?.includes('admin')) {
		error(403, 'Admin access required');
	}
	return event;
}

function normalize_slug(input_text: string) {
	return get_slug(input_text, {
		separator: '-',
		truncate: 120,
		symbols: false
	});
}

function nullify_optional(value: string | null | undefined): string | null {
	if (value === null || value === undefined) {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

export const list_guests = query(list_guests_schema, async (input) => {
	assert_admin_user();

	const search_text = input.search_text?.trim() || '';
	const page = Math.max(1, input.page || 1);
	const page_size = Math.min(100, Math.max(1, input.page_size || 25));
	const offset = (page - 1) * page_size;

	const where_clause = search_text.length > 0 ? ilike(guest.name, `%${search_text}%`) : undefined;

	const total_rows = where_clause
		? await db.select({ total: sql<number>`count(*)` }).from(guest).where(where_clause)
		: await db.select({ total: sql<number>`count(*)` }).from(guest);

	const total = Number(total_rows[0]?.total || 0);

	const items = await db.query.guest.findMany({
		where: where_clause,
		orderBy: [asc(guest.name)],
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

export const get_guest_detail = query(v.string(), async (guest_id) => {
	assert_admin_user();

	const result = await db.query.guest.findFirst({
		where: eq(guest.id, guest_id),
		with: {
			socialLinks: true
		}
	});

	return result ?? null;
});

export const create_guest = command(create_guest_schema, async (input) => {
	assert_admin_user();

	const normalized_slug = normalize_slug(input.name);
	if (!normalized_slug) {
		error(400, 'Unable to generate slug from name. Please provide a valid name.');
	}

	const existing_slug = await db.query.guest.findFirst({
		where: eq(guest.name_slug, normalized_slug),
		columns: {
			id: true
		}
	});

	if (existing_slug) {
		error(409, 'A guest with that name (slug) already exists');
	}

	const [created_guest] = await db
		.insert(guest)
		.values({
			name: input.name,
			name_slug: normalized_slug
		})
		.returning({ id: guest.id });

	return { id: created_guest.id };
});

export const update_guest = command(update_guest_schema, async (input) => {
	assert_admin_user();

	const normalized_slug = normalize_slug(input.name_slug);
	if (!normalized_slug) {
		error(400, 'Slug is invalid');
	}

	const slug_conflict = await db.query.guest.findFirst({
		where: and(eq(guest.name_slug, normalized_slug), ne(guest.id, input.id)),
		columns: {
			id: true
		}
	});

	if (slug_conflict) {
		error(409, 'Slug already exists');
	}

	await db
		.update(guest)
		.set({
			name: input.name.trim(),
			name_slug: normalized_slug,
			twitter: nullify_optional(input.twitter),
			github: nullify_optional(input.github),
			url: nullify_optional(input.url),
			of: nullify_optional(input.of) ?? ''
		})
		.where(eq(guest.id, input.id));

	return { success: true };
});

export const delete_guest = command(delete_guest_schema, async (input) => {
	assert_admin_user();

	if (input.confirm_text !== 'DELETE') {
		error(400, 'Type DELETE to confirm guest deletion');
	}

	await db.delete(guest).where(eq(guest.id, input.guest_id));

	return { success: true };
});

export const add_social_link = command(add_social_link_schema, async (input) => {
	assert_admin_user();

	await db
		.insert(socialLink)
		.values({
			guest_id: input.guest_id,
			link: input.link.trim()
		})
		.onConflictDoNothing();

	return { success: true };
});

export const remove_social_link = command(remove_social_link_schema, async (input) => {
	assert_admin_user();

	await db.delete(socialLink).where(eq(socialLink.id, input.social_link_id));

	return { success: true };
});
