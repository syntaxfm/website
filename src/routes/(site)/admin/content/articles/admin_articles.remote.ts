import { command, getRequestEvent, query } from '$app/server';
import { db } from '$server/db/client';
import { article, content } from '$server/db/schema';
import { error } from '@sveltejs/kit';
import { and, desc, eq, ne } from 'drizzle-orm';
import * as v from 'valibot';
import get_slug from 'speakingurl';

const CONTENT_STATUS_VALUES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

const create_article_schema = v.object({
	title: v.pipe(v.string(), v.trim(), v.minLength(1)),
	slug: v.optional(v.string())
});

const update_article_schema = v.object({
	content_id: v.string(),
	title: v.pipe(v.string(), v.trim(), v.minLength(1)),
	slug: v.pipe(v.string(), v.trim(), v.minLength(1)),
	status: v.picklist(CONTENT_STATUS_VALUES),
	published_at_iso: v.optional(v.nullable(v.string())),
	body: v.string(),
	author_id: v.string()
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

export const get_all_articles = query(async () => {
	assert_admin_user();

	return db.query.article.findMany({
		with: {
			meta: true,
			author: true
		},
		orderBy: (article_item, { desc }) => [desc(article_item.id)]
	});
});

export const create_article = command(create_article_schema, async (input) => {
	const event = assert_admin_user();

	if (!event.locals.user?.id) {
		error(401, 'Missing authenticated user');
	}

	const normalized_slug = normalize_slug(input.slug?.trim() || input.title);
	if (!normalized_slug) {
		error(400, 'Unable to generate slug from title. Please provide a valid title/slug.');
	}

	const duplicate_slug = await db.query.content.findFirst({
		where: eq(content.slug, normalized_slug),
		columns: {
			id: true
		}
	});

	if (duplicate_slug) {
		error(409, 'Slug already exists');
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
		content_id: created_content.id
	};
});

export const get_article_editor = query(v.string(), async (content_id) => {
	assert_admin_user();

	return db.query.article.findFirst({
		where: eq(article.content_id, content_id),
		with: {
			meta: true,
			author: true
		}
	});
});

export const get_article_authors = query(async () => {
	assert_admin_user();

	return db.query.user.findMany({
		columns: {
			id: true,
			name: true,
			username: true,
			email: true
		},
		orderBy: (user_item, { asc }) => [asc(user_item.username)]
	});
});

export const update_article = command(update_article_schema, async (input) => {
	assert_admin_user();

	const normalized_slug = normalize_slug(input.slug);
	if (!normalized_slug) {
		error(400, 'Slug is invalid');
	}

	const duplicate_slug = await db.query.content.findFirst({
		where: and(eq(content.slug, normalized_slug), ne(content.id, input.content_id)),
		columns: {
			id: true
		}
	});

	if (duplicate_slug) {
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

	await db
		.update(article)
		.set({
			body: input.body,
			author_id: input.author_id
		})
		.where(eq(article.content_id, input.content_id));

	return {
		success: true
	};
});
