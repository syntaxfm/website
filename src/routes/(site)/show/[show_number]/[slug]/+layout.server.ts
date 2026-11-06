import { error } from '@sveltejs/kit';
import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';
import { show } from '$server/db/schema';
import { inArray } from 'drizzle-orm';
import { get_show_detail_query } from '$server/shows/shows_queries';
import { markdown_to_content } from '#lib/content/markdown_to_content.server.ts';
import type { LayoutServerLoad } from './$types';

// The show, its neighbours and its rendered notes. Two database round trips (~100-150 ms each from
// the Worker; Postgres itself takes under 1 ms) plus the Markdown render, so the result is edge
// cached. Pages can't be shared-cached, since every page renders for its visitor (hooks.server.ts).
async function load_show_page(show_number: number) {
	const [show_data, prev_next] = await Promise.all([
		db.query.show.findFirst(get_show_detail_query(show_number)),
		db.query.show.findMany({
			where: inArray(show.number, [show_number - 1, show_number + 1]),
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

export const load: LayoutServerLoad = async ({ params, locals, url }) => {
	const show_number = parseInt(params.show_number);

	const show_page = await edge_cached(
		`show-page-${show_number}`,
		{ fresh_seconds: 60 * 5, stale_seconds: 60 * 60 * 24 },
		() => load_show_page(show_number)
	);

	const now = new Date();
	const show_date = new Date(show_page?.show.date || '');
	const is_admin = locals?.user?.roles?.includes('admin');

	if (show_date > now && !is_admin) {
		error(401, `That is a show, but it's in the future! \n\nCome back ${show_date}`);
	}
	if (!show_page) {
		error(404, `This show does not exist.`);
	}

	const { show: show_fields, show_notes, prev_next } = show_page;

	return {
		show: show_fields,
		show_notes,
		time_start: url.searchParams.get('t') || '0',
		prev_show: prev_next.find((s) => s.number === show_number - 1),
		next_show: prev_next.find((s) => s.number === show_number + 1),
		meta: {
			title: `${
				url.pathname.includes('/transcript') ? 'Transcript: ' : ''
			}${show_fields.title} - Syntax #${show_number}`,
			image: `${url.protocol}//${url.host}/og/${show_number}.jpg`,
			url: `${url.protocol}//${url.host}${url.pathname}`,
			canonical: `${url.protocol}//${url.host}${url.pathname}`,
			description: show_fields.aiShowNote?.description
		}
	};
};
