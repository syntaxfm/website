// Snack Pack issues are content (type NEWSLETTER) copied from Kit, so the archive, the feed and the
// sitemap read them from Postgres instead of waiting 1-2 s on Kit. Kit stays the source of truth:
// the copy refreshes itself in the background once it's older than SYNC_EVERY_MS. No cron needed.
import { and, desc, eq, max, notInArray, sql } from 'drizzle-orm';
import { getRequestEvent } from '$app/server';
import { CONVERT_KIT_V4_API_KEY } from '$app/env/private';
import { db } from '$server/db/client';
import { content, newsletter_issue } from '$server/db/schema';
import { get_newsletter_issue_slug } from '#lib/newsletter/issue_slug.ts';
import { fetch_snackpack_issues } from './kit';

// A new issue goes out about every two weeks
const SYNC_EVERY_MS = 1000 * 60 * 60 * 6;

export type NewsletterIssue = {
	// Kit's broadcast id, which /snackpack/[issue_id] uses
	id: string;
	issue_number: number | null;
	title: string;
	published_at: string;
};

// Every sync stamps updated_at on each issue it copies, so the newest stamp is the last sync
async function get_last_sync(): Promise<Date | null> {
	const [row] = await db
		.select({ last_sync: max(content.updated_at) })
		.from(content)
		.where(eq(content.type, 'NEWSLETTER'));
	return row?.last_sync ?? null;
}

export async function sync_newsletter_issues(): Promise<number> {
	if (!CONVERT_KIT_V4_API_KEY) throw new Error('CONVERT_KIT_V4_API_KEY is not set');
	const issues = await fetch_snackpack_issues(CONVERT_KIT_V4_API_KEY);
	// An empty answer is far more likely a Kit hiccup than every issue being pulled
	if (!issues.length) throw new Error('Kit returned no Snack Pack issues');

	const now = new Date();
	const slugs = issues.map(({ id }) => get_newsletter_issue_slug(id));

	await db.transaction(async (tx) => {
		const content_rows = await tx
			.insert(content)
			.values(
				issues.map((issue) => ({
					title: issue.title.slice(0, 255),
					slug: get_newsletter_issue_slug(issue.id),
					type: 'NEWSLETTER' as const,
					status: 'PUBLISHED' as const,
					published_at: issue.published_at,
					updated_at: now
				}))
			)
			// Status is left alone on existing rows, so an issue archived in admin stays archived.
			// setWhere keeps a sync from ever touching another content type that shares a slug.
			.onConflictDoUpdate({
				target: content.slug,
				set: {
					title: sql`excluded.title`,
					published_at: sql`excluded.published_at`,
					updated_at: sql`excluded.updated_at`
				},
				setWhere: eq(content.type, 'NEWSLETTER')
			})
			.returning({ id: content.id, slug: content.slug });

		const content_id_by_slug = new Map(content_rows.map((row) => [row.slug, row.id]));
		const issue_rows = issues.flatMap((issue) => {
			const content_id = content_id_by_slug.get(get_newsletter_issue_slug(issue.id));
			return content_id ? [{ id: issue.id, issue_number: issue.issue_number, content_id }] : [];
		});

		await tx
			.insert(newsletter_issue)
			.values(issue_rows)
			.onConflictDoUpdate({
				target: newsletter_issue.id,
				set: { issue_number: sql`excluded.issue_number`, content_id: sql`excluded.content_id` }
			});

		// Issues Kit no longer lists as sent (made private, or deleted) leave the site
		await tx
			.update(content)
			.set({ status: 'ARCHIVED', updated_at: now })
			.where(
				and(
					eq(content.type, 'NEWSLETTER'),
					eq(content.status, 'PUBLISHED'),
					notInArray(content.slug, slugs)
				)
			);
	});

	return issues.length;
}

// One sync at a time per server instance, however many requests find the copy stale
let running_sync: Promise<number> | null = null;

function start_sync() {
	running_sync ??= sync_newsletter_issues().finally(() => {
		running_sync = null;
	});
	return running_sync;
}

// Starts a sync without waiting on it when the copy is older than SYNC_EVERY_MS. Never throws:
// the home feed calls it, and a stale newsletter list mustn't take the feed down.
export async function refresh_newsletter_issues_if_stale(): Promise<void> {
	const last_sync = await get_last_sync().catch((error: unknown) => {
		console.error('Could not check when Snack Pack issues were last synced', error);
		return new Date();
	});
	if (last_sync && Date.now() - last_sync.getTime() < SYNC_EVERY_MS) return;

	const background = start_sync().catch((error: unknown) => {
		console.error('Could not sync Snack Pack issues from Kit', error);
	});
	getRequestEvent().platform?.ctx?.waitUntil(background);
}

async function read_newsletter_issues(): Promise<NewsletterIssue[]> {
	const rows = await db
		.select({
			id: newsletter_issue.id,
			issue_number: newsletter_issue.issue_number,
			title: content.title,
			published_at: content.published_at
		})
		.from(newsletter_issue)
		.innerJoin(content, eq(content.id, newsletter_issue.content_id))
		.where(eq(content.status, 'PUBLISHED'))
		.orderBy(desc(content.published_at));

	return rows.flatMap(({ published_at, ...issue }) =>
		published_at ? [{ ...issue, published_at: published_at.toISOString() }] : []
	);
}

export async function get_newsletter_issues(): Promise<NewsletterIssue[]> {
	const issues = await read_newsletter_issues();
	if (issues.length) {
		await refresh_newsletter_issues_if_stale();
		return issues;
	}

	// Nothing copied yet (a fresh database): wait for Kit this once
	try {
		await start_sync();
	} catch (error) {
		console.error('Could not sync Snack Pack issues from Kit', error);
		return [];
	}
	return read_newsletter_issues();
}
