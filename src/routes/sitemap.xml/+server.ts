import type { RequestHandler } from '@sveltejs/kit';
import { PUBLIC_URL } from '$app/env/public';
import { and, eq, isNotNull, lte } from 'drizzle-orm';
import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';
import { content, content_tags, guest, show, tag, transcript } from '$server/db/schema';
import { sitemap_xml, type SitemapUrl } from '#lib/seo/sitemap.ts';

const STATIC_PATHS = [
	'',
	'/shows',
	'/guests',
	'/about',
	'/potluck',
	'/sickpicks',
	'/snackpack',
	'/pages/privacy',
	'/pages/terms-of-service',
	'/pages/giveaway-rules'
];

// Three queries (~100 ms each from the Worker), and the answer only changes when a show is
// released or edited, so the rows are edge cached.
async function load_sitemap_rows() {
	const [shows, guests, tags] = await Promise.all([
		db
			.select({
				number: show.number,
				slug: show.slug,
				date: show.date,
				updated_at: content.updated_at,
				transcript_show_number: transcript.show_number
			})
			.from(show)
			.leftJoin(content, eq(content.id, show.content_id))
			.leftJoin(transcript, eq(transcript.show_number, show.number))
			.where(lte(show.date, new Date())),
		db.select({ name_slug: guest.name_slug }).from(guest),
		db
			.selectDistinct({ slug: tag.slug })
			.from(tag)
			.innerJoin(content_tags, eq(content_tags.tag_id, tag.id))
			.innerJoin(content, eq(content.id, content_tags.content_id))
			.where(and(eq(content.status, 'PUBLISHED'), isNotNull(tag.slug)))
	]);
	return { shows, guests, tags };
}

export const GET: RequestHandler = async function GET({ setHeaders }) {
	const { shows, guests, tags } = await edge_cached(
		'sitemap-rows',
		{ fresh_seconds: 60 * 60, stale_seconds: 60 * 60 * 24 },
		load_sitemap_rows
	);

	const urls: SitemapUrl[] = [
		...STATIC_PATHS.map((path) => ({ path })),
		...shows.flatMap((row) => {
			const path = `/show/${row.number}/${row.slug}`;
			const lastmod = row.updated_at && row.updated_at > row.date ? row.updated_at : row.date;
			return row.transcript_show_number === null
				? [{ path, lastmod }]
				: [{ path, lastmod }, { path: `${path}/transcript` }];
		}),
		...guests.map((row) => ({ path: `/guest/${row.name_slug}` })),
		...tags.flatMap((row) => (row.slug ? [{ path: `/tags/${row.slug}` }] : []))
	];

	setHeaders({
		'cache-control': 'max-age=0, s-maxage=3600',
		'content-type': 'application/xml'
	});

	return new Response(sitemap_xml(`https://${PUBLIC_URL}`, urls));
};
