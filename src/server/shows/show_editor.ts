import { in_order_added } from '#lib/utils/in_order_added.ts';
import { error } from '@sveltejs/kit';
import { and, count, desc, eq, gte, ilike, inArray, lte, ne, notInArray, sql } from 'drizzle-orm';

import { DAYS_OF_WEEK_TYPES } from '$const';
import { assert_admin_actor, is_admin, type Actor } from '$server/auth/authorization';
import { db } from '$server/db/client';
import {
	content,
	content_tags,
	contentGuest,
	contentHost,
	show,
	transcriptUtterance
} from '$server/db/schema';
import { get_id_from_show_number } from '$server/shows';
import { get_show_detail_query } from '$server/shows/shows_queries';
import { get_hash_from_content } from '$utilities/file_utilities/get_hash_from_content';
import { left_pad } from '$utilities/left_pad';
import { parse_optional_iso_date } from '$utilities/parse_optional_iso_date';

// Shows: Syntax episodes. The admin show editor (admin_podcast.remote.ts) and the MCP endpoint
// (server/mcp) both call these with the person acting, so the rules live here once.

type ShowStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ListShowsInput {
	search_text?: string;
	status?: ShowStatus | 'ALL';
	date_from_iso?: string;
	date_to_iso?: string;
	page?: number;
	page_size?: number;
}

export interface CreateShowInput {
	show_number: number;
	title: string;
	slug: string;
	status: ShowStatus;
	published_at_iso?: string | null;
	show_notes: string;
	url: string;
	youtube_url?: string | null;
}

export interface UpdateShowInput extends CreateShowInput {
	host_ids?: string[];
	guest_ids?: string[];
	tag_ids?: string[];
}

function content_ids_with_status(status: ShowStatus) {
	return db.select({ id: content.id }).from(content).where(eq(content.status, status));
}

/**
 * One page of Shows, newest number first. Admins see every status; anyone else only released
 * Shows (published, and dated now or earlier), whatever status they ask for.
 */
export async function list_shows(actor: Actor, input: ListShowsInput) {
	const search_text = input.search_text?.trim() || '';
	const status = input.status || 'ALL';
	const page = Math.max(1, input.page || 1);
	const page_size = Math.min(100, Math.max(1, input.page_size || 25));
	const offset = (page - 1) * page_size;

	const where_clauses = [];

	if (!is_admin(actor)) {
		where_clauses.push(
			inArray(show.content_id, content_ids_with_status('PUBLISHED')),
			lte(show.date, new Date())
		);
	}

	if (search_text.length > 0) {
		where_clauses.push(ilike(show.title, `%${search_text}%`));
	}

	if (status !== 'ALL') {
		where_clauses.push(inArray(show.content_id, content_ids_with_status(status)));
	}

	const date_from = parse_optional_iso_date(input.date_from_iso);
	if (date_from) {
		where_clauses.push(gte(show.date, date_from));
	}

	const date_to = parse_optional_iso_date(input.date_to_iso);
	if (date_to) {
		where_clauses.push(lte(show.date, date_to));
	}

	const where_clause = where_clauses.length > 0 ? and(...where_clauses) : undefined;

	const total_rows = where_clause
		? await db
				.select({ total: sql<number>`count(*)` })
				.from(show)
				.where(where_clause)
		: await db.select({ total: sql<number>`count(*)` }).from(show);

	const total = Number(total_rows[0]?.total || 0);

	const items = await db.query.show.findMany({
		where: where_clause,
		with: {
			meta: true
		},
		orderBy: [desc(show.number)],
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

/** Everything the show editor edits: content, tags, AI notes, guests, hosts. Admins only. */
export async function get_show_editor(actor: Actor, show_number: number) {
	assert_admin_actor(actor);

	const editor_show = await db.query.show.findFirst({
		where: eq(show.number, show_number),
		with: {
			meta: {
				with: {
					tags: {
						with: {
							tag: true
						}
					}
				}
			},
			aiShowNote: {
				with: {
					summary: true,
					tweets: true,
					links: true,
					guests: true,
					topics: true
				}
			},
			guests: {
				orderBy: in_order_added,
				with: {
					guest: true
				}
			},
			hosts: {
				orderBy: in_order_added,
				with: {
					profile: true
				}
			},
			transcript: {
				columns: {
					id: true
				}
			}
		}
	});
	if (!editor_show) return editor_show;

	// How many lines the transcript has, so the editor can show it exists and how big it is
	const [line_count_row] = editor_show.transcript
		? await db
				.select({ value: count() })
				.from(transcriptUtterance)
				.where(eq(transcriptUtterance.transcript_id, editor_show.transcript.id))
		: [];
	return { ...editor_show, transcript_line_count: Number(line_count_row?.value ?? 0) };
}

/**
 * A Show as the person acting may see it: the editor's view for an admin; for anyone else the
 * public page's view, and only once it is released (a future date is hidden, as on its page).
 */
export async function get_show(actor: Actor, show_number: number) {
	if (is_admin(actor)) {
		return (await get_show_editor(actor, show_number)) ?? null;
	}

	const public_show = await db.query.show.findFirst(get_show_detail_query(show_number));
	return public_show && public_show.date <= new Date() ? public_show : null;
}

export async function create_show(actor: Actor, input: CreateShowInput) {
	assert_admin_actor(actor);

	const duplicate_show_number = await db.query.show.findFirst({
		where: eq(show.number, input.show_number),
		columns: {
			id: true
		}
	});

	if (duplicate_show_number) {
		error(409, 'Show number already exists');
	}

	const duplicate_slug = await db.query.content.findFirst({
		where: eq(content.slug, input.slug),
		columns: {
			id: true
		}
	});

	if (duplicate_slug) {
		error(409, 'Slug already exists on another content item');
	}

	let next_published_at = parse_optional_iso_date(input.published_at_iso || null);
	if (input.status === 'PUBLISHED' && !next_published_at) {
		next_published_at = new Date();
	}

	const show_date = next_published_at || new Date();
	const show_id = get_id_from_show_number(input.show_number);
	const day_of_week = show_date.getDay();
	const show_type = DAYS_OF_WEEK_TYPES[day_of_week] || 'SPECIAL';
	const md_file = `/shows/${left_pad(input.show_number)} - ${input.slug}.md`;
	const hash = await get_hash_from_content(
		`${input.show_number}:${input.title}:${input.slug}:${input.url}:${input.show_notes}`
	);

	const created_content = await db.transaction(async (tx) => {
		const [inserted_content] = await tx
			.insert(content)
			.values({
				title: input.title,
				slug: input.slug,
				type: 'PODCAST',
				status: input.status,
				published_at: next_published_at
			})
			.returning({ id: content.id });

		await tx.insert(show).values({
			id: show_id,
			number: input.show_number,
			title: input.title,
			slug: input.slug,
			date: show_date,
			url: input.url,
			youtube_url: input.youtube_url || null,
			show_notes: input.show_notes,
			show_type,
			hash,
			md_file,
			content_id: inserted_content.id,
			updated_at: new Date()
		});

		return inserted_content;
	});

	return {
		success: true,
		show_number: input.show_number,
		content_id: created_content.id,
		show_id
	};
}

/**
 * Saves a Show and its Content. Publishing without a date publishes it now; a future date
 * schedules it. host_ids, guest_ids and tag_ids, when given, replace that list.
 */
export async function update_show(actor: Actor, input: UpdateShowInput) {
	assert_admin_actor(actor);

	const existing_show = await db.query.show.findFirst({
		where: eq(show.number, input.show_number),
		columns: {
			id: true,
			date: true,
			content_id: true
		}
	});

	if (!existing_show) {
		error(404, 'Show not found');
	}
	const content_id = existing_show.content_id;

	const duplicate_slug = await db.query.content.findFirst({
		where: content_id
			? and(eq(content.slug, input.slug), ne(content.id, content_id))
			: eq(content.slug, input.slug),
		columns: {
			id: true
		}
	});

	if (duplicate_slug) {
		error(409, 'Slug already exists on another content item');
	}

	const replaces_links =
		input.tag_ids !== undefined || input.guest_ids !== undefined || input.host_ids !== undefined;
	if (replaces_links && !content_id) {
		error(409, 'Show is not linked to content; its tags, guests and hosts cannot be replaced');
	}

	let next_published_at = parse_optional_iso_date(input.published_at_iso || null);
	if (input.status === 'PUBLISHED' && !next_published_at) {
		next_published_at = new Date();
	}

	await db.transaction(async (tx) => {
		const updated_show = await tx
			.update(show)
			.set({
				title: input.title,
				slug: input.slug,
				show_notes: input.show_notes,
				url: input.url,
				youtube_url: input.youtube_url || null,
				date: next_published_at || existing_show.date,
				updated_at: new Date()
			})
			.where(eq(show.number, input.show_number))
			.returning({ id: show.id });

		if (updated_show.length === 0) {
			error(404, 'Show not found');
		}

		if (content_id) {
			const updated_content = await tx
				.update(content)
				.set({
					title: input.title,
					slug: input.slug,
					status: input.status,
					published_at: next_published_at,
					updated_at: new Date()
				})
				.where(and(eq(content.id, content_id), eq(content.type, 'PODCAST')))
				.returning({ id: content.id });

			if (updated_content.length === 0) {
				error(404, 'Show content not found');
			}
		}

		if (input.guest_ids !== undefined && content_id) {
			const guest_ids = [...new Set(input.guest_ids)].sort();

			if (guest_ids.length === 0) {
				await tx.delete(contentGuest).where(eq(contentGuest.content_id, content_id));
			} else {
				await tx
					.delete(contentGuest)
					.where(
						and(
							eq(contentGuest.content_id, content_id),
							notInArray(contentGuest.guest_id, guest_ids)
						)
					);

				await tx
					.insert(contentGuest)
					.values(guest_ids.map((guest_id) => ({ content_id, guest_id })))
					.onConflictDoNothing();
			}
		}

		if (input.host_ids !== undefined && content_id) {
			const host_ids = [...new Set(input.host_ids)].sort();

			await tx.delete(contentHost).where(eq(contentHost.content_id, content_id));
			if (host_ids.length > 0) {
				await tx
					.insert(contentHost)
					.values(host_ids.map((profile_id) => ({ content_id, profile_id })));
			}
		}

		if (input.tag_ids !== undefined && content_id) {
			const tag_ids = [...new Set(input.tag_ids)].sort();

			await tx.delete(content_tags).where(eq(content_tags.content_id, content_id));
			if (tag_ids.length > 0) {
				await tx.insert(content_tags).values(
					tag_ids.map((tag_id) => ({
						content_id,
						tag_id
					}))
				);
			}
		}
	});

	return { success: true };
}

/**
 * Gives a Show a new number. Its id follows (it is built from the number, and creating a Show with
 * the old number later would otherwise collide). Guests, hosts, transcript and AI notes link to its
 * content id, so they stay with it.
 */
export async function renumber_show(actor: Actor, show_number: number, new_show_number: number) {
	assert_admin_actor(actor);

	if (!Number.isInteger(new_show_number) || new_show_number < 1) {
		error(400, 'A show number is a whole number above 0');
	}
	if (new_show_number === show_number) return { show_number };

	const taken = await db.query.show.findFirst({
		where: eq(show.number, new_show_number),
		columns: { id: true }
	});
	if (taken) error(409, `Show #${new_show_number} already exists`);

	const renumbered = await db
		.update(show)
		.set({
			number: new_show_number,
			id: get_id_from_show_number(new_show_number),
			updated_at: new Date()
		})
		.where(eq(show.number, show_number))
		.returning({ number: show.number });
	if (renumbered.length === 0) error(404, 'Show not found');

	return { show_number: new_show_number };
}
