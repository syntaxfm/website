import { error } from '@sveltejs/kit';
import { processor } from '$utilities/markdown.js';
import { db } from '$server/db/client';
import { show } from '$server/db/schema';
import { inArray } from 'drizzle-orm';
import { get_show_detail_query } from '$server/shows/shows_queries';

export const load = async function ({ params, locals, url }) {
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

	// Check if this is a future show
	const now = new Date();
	const show_date = new Date(show_data?.date || '');
	const is_admin = locals?.user?.roles?.includes('admin');
	if (show_date > now && !is_admin) {
		error(401, `That is a show, but it's in the future! \n\nCome back ${show_date}`);
	}
	if (!show) {
		error(404, `This show does not exist.`);
	}

	const body_excerpt = await processor.process(show_data?.show_notes || '');

	// Regular expression pattern and replacement
	const pattern = /(<h2>)(?!Show Notes<\/h2>)(.*?)(<\/h2>)/g;
	const replacement = '<h3>$2</h3>';

	const body_string = body_excerpt.toString();
	// the md has h2s in it, it's not reasonable to change all of the md,
	// so I'm making them be h3s instead
	// maybe that's a todo for another day
	const with_h3_body = body_string.replace(pattern, replacement);
	show_data.show_notes = with_h3_body;

	return {
		show: show_data,
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
			description:
				show_data?.aiShowNote?.description ?? show_data?.show_notes?.match(/(.*?)(?=## )/s)?.[0]
		}
	};
};
