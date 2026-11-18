import { error } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';

import { assert_admin_actor, type Actor } from '$server/auth/authorization';
import { db } from '$server/db/client';
import { article, content, content_tags } from '$server/db/schema';
import { normalize_slug } from '$utilities/normalize_slug';
import { parse_optional_iso_date } from '$utilities/parse_optional_iso_date';

// Articles: long-form posts, each wrapped by an ARTICLE Content row. The admin article editor
// (admin_articles.remote.ts) and the MCP endpoint (server/mcp) both call these with the person
// acting, so the rules live here once.

const ARTICLE_SLUG_MAX_LENGTH = 120;

type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface CreateArticleInput {
	title: string;
	slug?: string;
}

export interface UpdateArticleInput {
	content_id: string;
	title: string;
	slug: string;
	status: ArticleStatus;
	published_at_iso?: string | null;
	body: string;
	author_id: string;
	tag_ids?: string[];
}

/** A new, empty draft article by the acting admin's Profile. */
export async function create_article(actor: Actor, input: CreateArticleInput) {
	assert_admin_actor(actor);

	const author_id = actor.profile_id;
	if (!author_id) {
		error(401, 'Missing authenticated user');
	}

	const normalized_slug = normalize_slug(
		input.slug?.trim() || input.title,
		ARTICLE_SLUG_MAX_LENGTH
	);
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
		content_id: created_content.id
	};
}

/**
 * Saves an article. Publishing without a date publishes it now; a future date schedules it. When
 * tag_ids is given it replaces the article's tags.
 */
export async function update_article(actor: Actor, input: UpdateArticleInput) {
	assert_admin_actor(actor);

	const normalized_slug = normalize_slug(input.slug, ARTICLE_SLUG_MAX_LENGTH);
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

	await db.transaction(async (tx) => {
		const updated_content = await tx
			.update(content)
			.set({
				title: input.title,
				slug: normalized_slug,
				status: input.status,
				published_at: next_published_at,
				updated_at: new Date()
			})
			.where(and(eq(content.id, input.content_id), eq(content.type, 'ARTICLE')))
			.returning({ id: content.id });

		if (updated_content.length === 0) {
			error(404, 'Article not found');
		}

		const updated_article = await tx
			.update(article)
			.set({
				body: input.body,
				author_id: input.author_id
			})
			.where(eq(article.content_id, input.content_id))
			.returning({ id: article.id });

		if (updated_article.length === 0) {
			error(404, 'Article not found');
		}

		if (input.tag_ids !== undefined) {
			const tag_ids = [...new Set(input.tag_ids)].sort();

			await tx.delete(content_tags).where(eq(content_tags.content_id, input.content_id));
			if (tag_ids.length > 0) {
				await tx.insert(content_tags).values(
					tag_ids.map((tag_id) => ({
						content_id: input.content_id,
						tag_id
					}))
				);
			}
		}
	});

	return {
		success: true
	};
}
