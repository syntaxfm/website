import { error } from '@sveltejs/kit';
import { db } from '$server/db/client';
import { get_show_detail_query } from '$server/shows/shows_queries';
import { get_request_user } from '$server/auth/request_auth';

export const load = async function (event) {
	const show_number = parseInt(event.params.show_number);
	// Gets show dynamically based on release date
	const show = await db.query.show.findFirst(get_show_detail_query(show_number));

	// Only an unreleased show asks who is signed in: admins can preview it, privately
	const show_date = new Date(show?.date || '');
	if (show_date > new Date()) {
		const user = await get_request_user(event);
		if (!user?.roles.includes('admin')) {
			throw error(401, `That is a show, but it's in the future! \n\nCome back ${show_date}`);
		}
		event.setHeaders({ 'cache-control': 'private, no-store' });
	}
	if (!show) throw error(404, 'Show not found');

	return {
		show
	};
};
