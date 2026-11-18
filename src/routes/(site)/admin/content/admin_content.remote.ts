import { command, query } from '$app/server';
import { assert_admin } from '$server/auth/request_auth';
import { db } from '$server/db/client';
import * as content_library from '$server/content/content';
import { article, content, content_tags, show, video } from '$server/db/schema';
import { normalize_slug } from '$utilities/normalize_slug';
import { parse_optional_iso_date } from '$utilities/parse_optional_iso_date';
import { error } from '@sveltejs/kit';
import { and, eq, inArray, ne } from 'drizzle-orm';
import * as v from 'valibot';

const CONTENT_SLUG_MAX_LENGTH = 120;

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
	tag_id: v.optional(v.string()),
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

// TEMP FUNCTION CAN BE REMOVED AFTER MIGRATION
// this finds shows and videos and makes content from them
export const populate_content_from_existing_data = command(async () => {
	await assert_admin();

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

export const list_content = query(list_content_schema, async (input) =>
	content_library.list_content(await assert_admin(), input)
);

export const get_all_content = query(async () => {
	const content_result = await content_library.list_content(await assert_admin(), {
		status: 'ALL',
		type: 'ALL',
		page: 1,
		page_size: 500
	});

	return content_result.items;
});

export const create_content = command(create_content_schema, async (input) => {
	const admin = await assert_admin();

	if (input.type !== 'ARTICLE') {
		error(
			400,
			input.type === 'VIDEO'
				? 'Video entries are created by YouTube imports. Use video import/sync.'
				: 'Only ARTICLE content can be created manually right now.'
		);
	}

	const maybe_slug = input.slug?.trim() || input.title;
	const normalized_slug = normalize_slug(maybe_slug, CONTENT_SLUG_MAX_LENGTH);
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

	const author_id = admin.profile_id;
	if (!author_id) {
		error(401, 'Missing authenticated user');
	}

	const created_content = await db.transaction(async (tx) => {
		const [inserted_content] = await tx
			.insert(content)
			.values({
				title: input.title,
				slug: normalized_slug,
				type: 'ARTICLE',
				status: 'DRAFT'
			})
			.returning({ id: content.id });

		await tx.insert(article).values({
			id: inserted_content.id,
			body: '',
			author_id,
			content_id: inserted_content.id
		});

		return inserted_content;
	});

	return {
		content_id: created_content.id,
		type: 'ARTICLE'
	};
});

export const get_content_detail = query(v.string(), async (content_id) =>
	content_library.get_content_detail(await assert_admin(), content_id)
);

export const update_content_meta = command(update_content_schema, async (input) => {
	await assert_admin();

	const normalized_slug = normalize_slug(input.slug, CONTENT_SLUG_MAX_LENGTH);
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
	await assert_admin();

	const normalized_slug = normalize_slug(input.slug, CONTENT_SLUG_MAX_LENGTH);
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
	await assert_admin();

	return db.query.tag.findMany({
		orderBy: (tag_item, { asc }) => [asc(tag_item.name)]
	});
});

export const assign_content_tags = command(bulk_tag_schema, async (input) =>
	content_library.assign_content_tags(await assert_admin(), input)
);

export const remove_content_tags = command(bulk_tag_schema, async (input) =>
	content_library.remove_content_tags(await assert_admin(), input)
);

export const bulk_update_status = command(bulk_status_schema, async (input) =>
	content_library.bulk_update_status(await assert_admin(), input)
);

export const bulk_delete_content = command(bulk_delete_schema, async (input) => {
	await assert_admin();

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

	const article_ids = existing_items
		.filter((item) => item.type === 'ARTICLE')
		.map((item) => item.id);

	// Videos are skipped too: the YouTube sync would bring a deleted one back, so they're archived
	const skipped = existing_items.filter((item) => item.type !== 'ARTICLE').map((item) => item.id);

	if (article_ids.length > 0) {
		await db.transaction(async (tx) => {
			await tx.delete(content_tags).where(inArray(content_tags.content_id, article_ids));
			await tx.delete(article).where(inArray(article.content_id, article_ids));
			await tx.delete(content).where(inArray(content.id, article_ids));
		});
	}

	return {
		success: true,
		deleted_count: article_ids.length,
		skipped_count: skipped.length,
		skipped_ids: skipped
	};
});

export const export_content = command(list_content_schema, async (input) => {
	const admin = await assert_admin();

	const export_result = await content_library.list_content(admin, {
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
