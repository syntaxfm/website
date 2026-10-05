import { error } from '@sveltejs/kit';
import { db } from '$server/db/client';
import { show } from '$server/db/schema';
import { inArray } from 'drizzle-orm';
import { get_show_detail_query } from '$server/shows/shows_queries';
import { markdown_to_content } from '$lib/content/markdown_to_content.server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals, url }) => {
	const show_number = parseInt(params.show_number);

	// Get the full show details
	const show_promise = db.query.show.findFirst(get_show_detail_query(show_number));

	const prev_next_show_promise = db.query.show.findMany({
		where: inArray(show.number, [show_number - 1, show_number + 1]),
		columns: {
			number: true,
			title: true,
			slug: true
		},
		limit: 2
	});

	const [show_data, prev_next] = await Promise.all([show_promise, prev_next_show_promise]);

	const now = new Date();
	const show_date = new Date(show_data?.date || '');
	const is_admin = locals?.user?.roles?.includes('admin');

	if (show_date > now && !is_admin) {
		error(401, `That is a show, but it's in the future! \n\nCome back ${show_date}`);
	}
	if (!show_data) {
		error(404, `This show does not exist.`);
	}

	// The notes reach the page as a safe content tree, not as Markdown or an HTML string.
	const { show_notes, ...show_fields } = show_data;

	return {
		show: show_fields,
		show_notes: markdown_to_content(show_notes),
		time_start: url.searchParams.get('t') || '0',
		prev_show: prev_next.find((s) => s.number === show_number - 1),
		next_show: prev_next.find((s) => s.number === show_number + 1),
		meta: {
			title: `${
				url.pathname.includes('/transcript') ? 'Transcript: ' : ''
			}${show_data?.title} - Syntax #${show_number}`,
			image: `${url.protocol}//${url.host}/og/${show_number}.jpg`,
			url: `${url.protocol}//${url.host}${url.pathname}`,
			canonical: `${url.protocol}//${url.host}${url.pathname}`,
			description: show_data.aiShowNote?.description
		}
	};
};
