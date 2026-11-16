// Old topic page URLs (/tags/web-dev) keep working after a tag is merged or its slug changes
import { eq } from 'drizzle-orm';
import { db } from '$server/db/client';
import { tag, tag_redirect } from '$server/db/schema';

/** The slug an old tag slug now lives at, or null when it was never moved. */
export async function find_tag_redirect(old_slug: string): Promise<string | null> {
	const [row] = await db
		.select({ slug: tag.slug })
		.from(tag_redirect)
		.innerJoin(tag, eq(tag.id, tag_redirect.tag_id))
		.where(eq(tag_redirect.old_slug, old_slug))
		.limit(1);
	return row?.slug ?? null;
}

/** Sends a tag's previous slug to the tag. A slug used again later points at its newest tag. */
export async function record_tag_redirect(old_slug: string, tag_id: string): Promise<void> {
	await db
		.insert(tag_redirect)
		.values({ old_slug, tag_id })
		.onConflictDoUpdate({ target: tag_redirect.old_slug, set: { tag_id } });
}
