import { command, getRequestEvent, query } from '$app/server';
import { db } from '$server/db/client';
import { article, content, content_tags, show, tag, video } from '$server/db/schema';
import { error } from '@sveltejs/kit';
import { and, desc, eq, gte, ilike, inArray, lte, ne, sql } from 'drizzle-orm';
import * as v from 'valibot';
import get_slug from 'speakingurl';

const CONTENT_TYPE_VALUES = ['PODCAST', 'ARTICLE', 'VIDEO', 'TOOL', 'NEWSLETTER', 'EVENT'] as const;
const CONTENT_STATUS_VALUES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

const FILTER_STATUS_VALUES = [...CONTENT_STATUS_VALUES, 'ALL'] as const;
const FILTER_TYPE_VALUES = [...CONTENT_TYPE_VALUES, 'ALL'] as const;

const list_content_schema = v.object({
	search_text: v.optional(v.string()),
	status: v.optional(v.picklist(FILTER_STATUS_VALUES)),
	type: v.optional(v.picklist(FILTER_TYPE_VALUES)),
	date_from_iso: v.optional(v.string()),
	date_to_iso: v.optional(v.string()),
	page: v.optional(v.number()),
	page_size: v.optional(v.number())
});

const update_content_schema = v.object({
	content_id: v.string(),
	title: v.pipe(v.string(), v.trim(), v.minLength(1)),
	slug: v.pipe(v.string(), v.trim(), v.minLength(1)),
	status: v.picklist(CONTENT_STATUS_VALUES),
	published_at_iso: v.optional(v.nullable(v.string()))
});

const create_content_schema = v.object({
	type: v.picklist(CONTENT_TYPE_VALUES),
	title: v.pipe(v.string(), v.trim(), v.minLength(1)),
	slug: v.optional(v.string())
});

const slug_check_schema = v.object({
	slug: v.pipe(v.string(), v.trim(), v.minLength(1)),
	exclude_content_id: v.optional(v.string())
});

const bulk_status_schema = v.object({
	content_ids: v.pipe(v.array(v.string()), v.minLength(1)),
	status: v.picklist(CONTENT_STATUS_VALUES)
});

const bulk_tag_schema = v.object({
	content_ids: v.pipe(v.array(v.string()), v.minLength(1)),
	tag_ids: v.pipe(v.array(v.string()), v.minLength(1))
});

const bulk_delete_schema = v.object({
	content_ids: v.pipe(v.array(v.string()), v.minLength(1)),
	confirm_text: v.string()
});

type ListContentInput = v.InferOutput<typeof list_content_schema>;

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

function parse_optional_iso_date(maybe_iso: string | null | undefined) {
	if (!maybe_iso) {
		return null;
	}

	const parsed_date = new Date(maybe_iso);
	if (Number.isNaN(parsed_date.getTime())) {
		return null;
	}

	return parsed_date;
}

async function fetch_content_list(input: ListContentInput) {
	const search_text = input.search_text?.trim() || '';
	const status = input.status || 'ALL';
	type FilterType = (typeof FILTER_TYPE_VALUES)[number];
	const type = (input.type || 'ALL') as FilterType;
	const page = Math.max(1, input.page || 1);
	const page_size = Math.min(100, Math.max(1, input.page_size || 25));
	const offset = (page - 1) * page_size;

	const where_clauses = [];

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

// TEMP FUNCTION CAN BE REMOVED AFTER MIGRATION
// this finds shows and videos and makes content from them
export const populate_content_from_existing_data = command(async () => {
	assert_admin_user();

	try {
		// Global slug counter across ALL content types (shows, videos, etc.)
		// This ensures slugs are unique in the content table even if shows/videos share slugs
		const slug_counts = new Map<string, number>();

		const shows = await db.query.show.findMany();
		let show_counter = 0;

		for (const show_item of shows) {
			// Skip if already has content_id
			if (show_item.content_id) {
				continue;
			}

			// Handle duplicate slugs by appending a counter
			let unique_slug = show_item.slug;
			const count = slug_counts.get(show_item.slug) || 0;
			if (count > 0) {
				unique_slug = `${show_item.slug}-${count}`;
			}
			slug_counts.set(show_item.slug, count + 1);

			try {
				// Use transaction to ensure atomicity
				await db.transaction(async (tx) => {
					// 1. Create the content record
					const [new_content] = await tx
						.insert(content)
						.values({
							title: show_item.title,
							slug: unique_slug,
							type: 'PODCAST',
							status: 'PUBLISHED',
							created_at: show_item.created_at,
							updated_at: new Date(),
							published_at: show_item.date
						})
						.returning();

					// 2. Update the show with the content_id
					await tx
						.update(show)
						.set({ content_id: new_content.id })
						.where(eq(show.id, show_item.id));
				});

				show_counter++;
			} catch (err) {
				console.error(`Failed to process show ${show_item.id}:`, err);
				// Continue with next show
			}
		}

		const videos = await db.query.video.findMany();
		let video_counter = 0;
		// DON'T clear slug_counts - we need to track across all content types!

		for (const video_item of videos) {
			// Skip if already has content_id
			if (video_item.content_id) {
				continue;
			}

			// Handle duplicate slugs by appending a counter
			let unique_slug = video_item.slug;
			const count = slug_counts.get(video_item.slug) || 0;
			if (count > 0) {
				unique_slug = `${video_item.slug}-${count}`;
			}
			slug_counts.set(video_item.slug, count + 1);

			try {
				// Use transaction to ensure atomicity
				await db.transaction(async (tx) => {
					// 1. Create the content record
					const [new_content] = await tx
						.insert(content)
						.values({
							title: video_item.title,
							slug: unique_slug,
							type: 'VIDEO',
							status: 'PUBLISHED',
							created_at: new Date(),
							updated_at: new Date(),
							published_at: video_item.published_at
						})
						.returning();

					// 2. Update the video with the content_id
					await tx
						.update(video)
						.set({ content_id: new_content.id })
						.where(eq(video.id, video_item.id));
				});

				video_counter++;
			} catch (err) {
				console.error(`Failed to process video ${video_item.id}:`, err);
				// Continue with next video
			}
		}

		return { success: true, shows: show_counter, videos: video_counter };
	} catch (err) {
		console.error('Error populating content:', err);
		return { success: false, error: 'Failed to populate content' };
	}
});

export const list_content = query(list_content_schema, async (input) => {
	assert_admin_user();
	return fetch_content_list(input);
});

export const get_all_content = query(async () => {
	assert_admin_user();

	const content_result = await fetch_content_list({
		status: 'ALL',
		type: 'ALL',
		page: 1,
		page_size: 500
	});

	return content_result.items;
});

export const create_content = command(create_content_schema, async (input) => {
	const event = assert_admin_user();

	if (input.type !== 'ARTICLE') {
		error(
			400,
			input.type === 'VIDEO'
				? 'Video entries are created by YouTube imports. Use video import/sync.'
				: 'Only ARTICLE content can be created manually right now.'
		);
	}

	const maybe_slug = input.slug?.trim() || input.title;
	const normalized_slug = normalize_slug(maybe_slug);
	if (!normalized_slug) {
		error(400, 'Unable to generate slug from title. Please provide a valid title/slug.');
	}

	const existing_slug = await db.query.content.findFirst({
		where: eq(content.slug, normalized_slug),
		columns: {
			id: true
		}
	});

	if (existing_slug) {
		error(409, 'Slug already exists');
	}

	if (!event.locals.user?.id) {
		error(401, 'Missing authenticated user');
	}

	const [created_content] = await db
		.insert(content)
		.values({
			title: input.title,
			slug: normalized_slug,
			type: 'ARTICLE',
			status: 'DRAFT'
		})
		.returning({ id: content.id });

	await db.insert(article).values({
		id: created_content.id,
		body: '',
		author_id: event.locals.user.id,
		content_id: created_content.id
	});

	return {
		content_id: created_content.id,
		type: 'ARTICLE'
	};
});

export const get_content_detail = query(v.string(), async (content_id) => {
	assert_admin_user();

	return db.query.content.findFirst({
		where: eq(content.id, content_id),
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
});

export const update_content_meta = command(update_content_schema, async (input) => {
	assert_admin_user();

	const normalized_slug = normalize_slug(input.slug);
	if (!normalized_slug) {
		error(400, 'Slug is invalid');
	}

	const existing_slug = await db.query.content.findFirst({
		where: and(eq(content.slug, normalized_slug), ne(content.id, input.content_id)),
		columns: {
			id: true
		}
	});

	if (existing_slug) {
		error(409, 'Slug already exists');
	}

	let next_published_at = parse_optional_iso_date(input.published_at_iso || null);
	if (input.status === 'PUBLISHED' && !next_published_at) {
		next_published_at = new Date();
	}

	await db
		.update(content)
		.set({
			title: input.title,
			slug: normalized_slug,
			status: input.status,
			published_at: next_published_at,
			updated_at: new Date()
		})
		.where(eq(content.id, input.content_id));

	const linked_show = await db.query.show.findFirst({
		where: eq(show.content_id, input.content_id),
		columns: {
			id: true
		}
	});

	if (linked_show) {
		await db
			.update(show)
			.set({
				title: input.title,
				slug: normalized_slug,
				date: next_published_at || new Date(),
				updated_at: new Date()
			})
			.where(eq(show.id, linked_show.id));
	}

	return { success: true };
});

export const check_slug_available = query(slug_check_schema, async (input) => {
	assert_admin_user();

	const normalized_slug = normalize_slug(input.slug);
	if (!normalized_slug) {
		return {
			normalized_slug,
			available: false
		};
	}

	const where_clause = input.exclude_content_id
		? and(eq(content.slug, normalized_slug), ne(content.id, input.exclude_content_id))
		: eq(content.slug, normalized_slug);

	const existing = await db.query.content.findFirst({
		where: where_clause,
		columns: {
			id: true
		}
	});

	return {
		normalized_slug,
		available: !existing
	};
});

export const get_tag_options = query(async () => {
	assert_admin_user();

	return db.query.tag.findMany({
		orderBy: (tag_item, { asc }) => [asc(tag_item.name)]
	});
});

export const assign_content_tags = command(bulk_tag_schema, async (input) => {
	assert_admin_user();

	const values = input.content_ids.flatMap((content_id) =>
		input.tag_ids.map((tag_id) => ({
			content_id,
			tag_id
		}))
	);

	await db.insert(content_tags).values(values).onConflictDoNothing();

	return { success: true, count: values.length };
});

export const remove_content_tags = command(bulk_tag_schema, async (input) => {
	assert_admin_user();

	await db
		.delete(content_tags)
		.where(
			and(
				inArray(content_tags.content_id, input.content_ids),
				inArray(content_tags.tag_id, input.tag_ids)
			)
		);

	return { success: true };
});

export const bulk_update_status = command(bulk_status_schema, async (input) => {
	assert_admin_user();

	const set_values: {
		status: (typeof CONTENT_STATUS_VALUES)[number];
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
});

export const bulk_delete_content = command(bulk_delete_schema, async (input) => {
	assert_admin_user();

	if (input.confirm_text !== 'DELETE') {
		error(400, 'Type DELETE to confirm bulk delete');
	}

	const existing_items = await db.query.content.findMany({
		where: inArray(content.id, input.content_ids),
		columns: {
			id: true,
			type: true
		}
	});

	const deletable_ids = existing_items
		.filter((item) => item.type === 'ARTICLE')
		.map((item) => item.id);

	const skipped = existing_items.filter((item) => item.type !== 'ARTICLE').map((item) => item.id);

	if (deletable_ids.length > 0) {
		await db.delete(content).where(inArray(content.id, deletable_ids));
	}

	return {
		success: true,
		deleted_count: deletable_ids.length,
		skipped_count: skipped.length,
		skipped_ids: skipped
	};
});

export const export_content = command(list_content_schema, async (input) => {
	assert_admin_user();

	const export_result = await fetch_content_list({
		...input,
		page: 1,
		page_size: 1000
	});

	return {
		filename: `content-export-${new Date().toISOString().slice(0, 10)}.json`,
		total: export_result.total,
		items: export_result.items
	};
});
