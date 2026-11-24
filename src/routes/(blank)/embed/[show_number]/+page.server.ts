import { error } from '@sveltejs/kit';
import { db } from '$server/db/client';
import { get_show_detail_query } from '$server/shows/shows_queries';
import { get_request_user } from '$server/auth/request_auth';
import { is_released } from '$server/content/released';

export const load = async function (event) {
	const show_number = parseInt(event.params.show_number);
	// Gets show dynamically based on release date
	const show = await db.query.show.findFirst(get_show_detail_query(show_number));

	if (!show) throw error(404, 'Show not found');

	// Only an unreleased show (a draft, or scheduled) asks who is signed in: admins can preview it,
	// privately
	if (!is_released(show.meta)) {
		const user = await get_request_user(event);
		if (!user?.roles.includes('admin')) throw error(404, 'Show not found');
		event.setHeaders({ 'cache-control': 'private, no-store' });
	}

	return {
		show
	};
};
