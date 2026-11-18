import { error, redirect } from '@sveltejs/kit';
import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';
import { get_request_user } from '$server/auth/request_auth';
import { show } from '$server/db/schema';
import { and, inArray } from 'drizzle-orm';
import { released_show_clause } from '$server/content/released';
import { get_show_detail_query } from '$server/shows/shows_queries';
import { markdown_to_content } from '#lib/content/markdown_to_content.server.ts';
import { episode_dates } from '#lib/seo/structured_data.ts';
import type { LayoutServerLoad } from './$types';

// The show, its neighbours and its rendered notes. Two database round trips (~100-150 ms each from
// the Worker; Postgres itself takes under 1 ms) plus the Markdown render, so the result is edge
// cached. Pages can't be shared-cached, since every page renders for its visitor (hooks.server.ts).
async function load_show_page(show_number: number) {
	const [show_data, prev_next] = await Promise.all([
		db.query.show.findFirst(get_show_detail_query(show_number)),
		db.query.show.findMany({
			// The next episode may be scheduled, not out yet
			where: and(inArray(show.number, [show_number - 1, show_number + 1]), released_show_clause()),
			columns: {
				number: true,
				title: true,
				slug: true
			},
			limit: 2
		})
	]);
	if (!show_data) return null;

	// The notes reach the page as a safe content tree, not as Markdown or an HTML string.
	const { show_notes, ...show_fields } = show_data;
	return { show: show_fields, show_notes: markdown_to_content(show_notes), prev_next };
}

export const load: LayoutServerLoad = async (event) => {
	const { params, url } = event;
	const show_number = parseInt(params.show_number);

	const show_page = await edge_cached(
		`show-page-${show_number}`,
		{ fresh_seconds: 60 * 5, stale_seconds: 60 * 60 * 24 },
		() => load_show_page(show_number)
	);

	// Only an unreleased show asks who is signed in: admins can preview it. That page is for the
	// admin alone, so it stays out of shared caches.
	const show_date = new Date(show_page?.show.date || '');
	if (show_date > new Date()) {
		const user = await get_request_user(event);
		if (!user?.roles.includes('admin')) {
			error(401, `That is a show, but it's in the future! \n\nCome back ${show_date}`);
		}
		event.setHeaders({ 'cache-control': 'private, no-store' });
	}
	if (!show_page) {
		error(404, `This show does not exist.`);
	}

	const { show: show_fields, show_notes, prev_next } = show_page;
	const is_transcript = url.pathname.endsWith('/transcript');
	const show_path = `/show/${show_number}/${show_fields.slug}${is_transcript ? '/transcript' : ''}`;
	// A wrong or cut-off slug (/show/900/13-new-css) is the same episode: one URL per page
	if (params.slug !== show_fields.slug) redirect(301, show_path + url.search);
	const canonical_url = `${url.origin}${show_path}`;

	return {
		show: show_fields,
		show_notes,
		time_start: url.searchParams.get('t') || '0',
		prev_show: prev_next.find((s) => s.number === show_number - 1),
		next_show: prev_next.find((s) => s.number === show_number + 1),
		meta: {
			title: `${is_transcript ? 'Transcript: ' : ''}${show_fields.title} - Syntax #${show_number}`,
			image: `${url.origin}/og/${show_number}.jpg`,
			url: canonical_url,
			canonical: canonical_url,
			description: show_fields.aiShowNote?.description,
			...episode_dates(show_fields)
		}
	};
};
