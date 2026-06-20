import { error } from '@sveltejs/kit';
import { db } from '$server/db/client';
import { get_show_detail_query } from '$server/shows/shows_queries';

export const load = async function ({ params, locals }) {
	const show_number = parseInt(params.show_number);
	// Gets show dynamically based on release date
	const show = await db.query.show.findFirst(get_show_detail_query(show_number));

	// Check if this is a future show
	const now = new Date();
	const show_date = new Date(show?.date || '');
	const is_admin = locals?.user?.roles?.includes('admin');
	if (show_date > now && !is_admin) {
		throw error(401, `That is a show, but it's in the future! \n\nCome back ${show_date}`);
	}
	if (!show) throw error(404, 'Show not found');

	return {
		user_theme: locals.theme,
		show
	};
};
