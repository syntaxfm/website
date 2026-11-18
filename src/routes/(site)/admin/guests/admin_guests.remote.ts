import { command, query } from '$app/server';
import { assert_admin } from '$server/auth/request_auth';
import { db } from '$server/db/client';
import { guest, socialLink } from '$server/db/schema';
import * as guests from '$server/guests/guests';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as v from 'valibot';

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

export const list_guests = query(list_guests_schema, async (input) =>
	guests.list_guests(await assert_admin(), input)
);

export const get_guest_detail = query(v.string(), async (guest_id) =>
	guests.get_guest_detail(await assert_admin(), guest_id)
);

export const create_guest = command(create_guest_schema, async (input) =>
	guests.create_guest(await assert_admin(), input)
);

export const update_guest = command(update_guest_schema, async (input) =>
	guests.update_guest(await assert_admin(), input)
);

export const delete_guest = command(delete_guest_schema, async (input) => {
	await assert_admin();

	if (input.confirm_text !== 'DELETE') {
		error(400, 'Type DELETE to confirm guest deletion');
	}

	await db.delete(guest).where(eq(guest.id, input.guest_id));

	return { success: true };
});

export const add_social_link = command(add_social_link_schema, async (input) => {
	await assert_admin();

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
	await assert_admin();

	await db.delete(socialLink).where(eq(socialLink.id, input.social_link_id));

	return { success: true };
});
