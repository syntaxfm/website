import { error } from '@sveltejs/kit';
import { and, asc, desc, eq, ilike, lte, ne, sql } from 'drizzle-orm';

import { assert_admin_actor, is_admin, type Actor } from '$server/auth/authorization';
import { db } from '$server/db/client';
import { guest, show, showGuest } from '$server/db/schema';
import { normalize_slug } from '$utilities/normalize_slug';

// Guests: people interviewed on a Show. The admin Guests page (admin_guests.remote.ts) and the MCP
// endpoint (server/mcp) both call these with the person acting, so the rules live here once.

const GUEST_SLUG_MAX_LENGTH = 120;

export interface ListGuestsInput {
	search_text?: string;
	page?: number;
	page_size?: number;
}

export interface CreateGuestInput {
	name: string;
}

export interface UpdateGuestInput {
	id: string;
	name: string;
	name_slug: string;
	twitter?: string | null;
	github?: string | null;
	url?: string | null;
	of?: string | null;
}

function nullify_optional(value: string | null | undefined): string | null {
	if (value === null || value === undefined) {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

// Guests and their links are public (the guest pages show them), so anyone signed in may list them
export async function list_guests(_actor: Actor, input: ListGuestsInput) {
	const search_text = input.search_text?.trim() || '';
	const page = Math.max(1, input.page || 1);
	const page_size = Math.min(100, Math.max(1, input.page_size || 25));
	const offset = (page - 1) * page_size;

	const where_clause = search_text.length > 0 ? ilike(guest.name, `%${search_text}%`) : undefined;

	const total_rows = where_clause
		? await db
				.select({ total: sql<number>`count(*)` })
				.from(guest)
				.where(where_clause)
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
}

/**
 * A guest, their social links, and their Shows, newest first. Admins see every Show; anyone else
 * only released ones, as the guest's public page shows.
 */
export async function get_guest_detail(actor: Actor, guest_id: string) {
	const result = await db.query.guest.findFirst({
		where: eq(guest.id, guest_id),
		with: {
			socialLinks: true
		}
	});

	if (!result) {
		return null;
	}

	const shows = await db
		.select({
			number: show.number,
			slug: show.slug,
			title: show.title,
			date: show.date
		})
		.from(showGuest)
		.innerJoin(show, eq(show.id, showGuest.show_id))
		.where(
			is_admin(actor)
				? eq(showGuest.guest_id, guest_id)
				: and(eq(showGuest.guest_id, guest_id), lte(show.date, new Date()))
		)
		.orderBy(desc(show.date));

	return { ...result, shows };
}

export async function create_guest(actor: Actor, input: CreateGuestInput) {
	assert_admin_actor(actor);

	const normalized_slug = normalize_slug(input.name, GUEST_SLUG_MAX_LENGTH);
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
}

export async function update_guest(actor: Actor, input: UpdateGuestInput) {
	assert_admin_actor(actor);

	const normalized_slug = normalize_slug(input.name_slug, GUEST_SLUG_MAX_LENGTH);
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
}
