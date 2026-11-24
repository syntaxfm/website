import type { RequestHandler } from '@sveltejs/kit';
import { PUBLIC_URL } from '$app/env/public';
import { and, eq, isNotNull, lte, max, sql } from 'drizzle-orm';
import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';
import {
	content,
	content_tags,
	contentGuest,
	guest,
	show,
	tag,
	transcript
} from '$server/db/schema';
import { MIN_ITEMS_TO_INDEX_TAG } from '#lib/seo/hubs.ts';
import { sitemap_xml, type SitemapUrl } from '#lib/seo/sitemap.ts';
import { get_newsletter_issues } from '$server/newsletter/issues';

const STATIC_PATHS = [
	'',
	'/videos',
	'/guests',
	'/about',
	'/potluck',
	'/sickpicks',
	'/snackpack',
	'/pages/privacy',
	'/pages/terms-of-service',
	'/pages/giveaway-rules'
];

// Four queries (~100 ms each from the Worker), and the answer only changes when a show is
// released or edited or the hourly video sync runs, so the rows are edge cached.
async function load_sitemap_rows() {
	const [shows, guests, tags, videos] = await Promise.all([
		db
			.select({
				number: show.number,
				slug: show.slug,
				date: show.date,
				updated_at: content.updated_at,
				transcript_id: transcript.id
			})
			.from(show)
			.leftJoin(content, eq(content.id, show.content_id))
			.leftJoin(transcript, eq(transcript.content_id, show.content_id))
			.where(lte(show.date, new Date())),
		// A guest or topic page changes when it gets a new episode
		db
			.select({ name_slug: guest.name_slug, lastmod: max(show.date) })
			.from(guest)
			.leftJoin(contentGuest, eq(contentGuest.guest_id, guest.id))
			.leftJoin(show, and(eq(show.content_id, contentGuest.content_id), lte(show.date, new Date())))
			.groupBy(guest.name_slug),
		db
			.select({ slug: tag.slug, lastmod: max(content.published_at) })
			.from(tag)
			.innerJoin(content_tags, eq(content_tags.tag_id, tag.id))
			.innerJoin(content, eq(content.id, content_tags.content_id))
			.where(
				and(
					eq(content.status, 'PUBLISHED'),
					lte(content.published_at, new Date()),
					isNotNull(tag.slug)
				)
			)
			.groupBy(tag.slug)
			// Thinner tag pages are noindex (src/routes/(site)/tags/[tag])
			.having(sql`count(*) >= ${MIN_ITEMS_TO_INDEX_TAG}`),
		// Video pages (/videos/[slug]). Not updated_at: every hourly sync sets it, and a lastmod that
		// always says "now" teaches search engines to ignore it.
		db
			.select({ slug: content.slug, lastmod: content.published_at })
			.from(content)
			.where(
				and(
					eq(content.type, 'VIDEO'),
					eq(content.status, 'PUBLISHED'),
					lte(content.published_at, new Date())
				)
			)
	]);
	return { shows, guests, tags, videos };
}

export const GET: RequestHandler = async function GET({ setHeaders }) {
	const [{ shows, guests, tags, videos }, snackpack_issues] = await Promise.all([
		edge_cached(
			// Served stale for up to a day: change the key when the rows change shape
			'sitemap-rows-3',
			{ fresh_seconds: 60 * 60, stale_seconds: 60 * 60 * 24 },
			load_sitemap_rows
		),
		get_newsletter_issues()
	]);

	const urls: SitemapUrl[] = [
		...STATIC_PATHS.map((path) => ({ path })),
		...shows.flatMap((row) => {
			const path = `/show/${row.number}/${row.slug}`;
			const lastmod = row.updated_at && row.updated_at > row.date ? row.updated_at : row.date;
			return row.transcript_id === null
				? [{ path, lastmod }]
				: [{ path, lastmod }, { path: `${path}/transcript` }];
		}),
		...videos.map((row) => ({ path: `/videos/${row.slug}`, lastmod: row.lastmod })),
		...guests.map((row) => ({ path: `/guest/${row.name_slug}`, lastmod: row.lastmod })),
		...tags.flatMap((row) =>
			row.slug ? [{ path: `/tags/${row.slug}`, lastmod: row.lastmod }] : []
		),
		...snackpack_issues.map((issue) => ({
			path: `/snackpack/${issue.id}`,
			lastmod: issue.published_at
		}))
	];

	setHeaders({
		'cache-control': 'max-age=0, s-maxage=3600',
		'content-type': 'application/xml'
	});

	return new Response(sitemap_xml(`https://${PUBLIC_URL}`, urls));
};
