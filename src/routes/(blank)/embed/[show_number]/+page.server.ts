import { cache } from '$/server/cache/cache';
import { error } from '@sveltejs/kit';

export const load = async function ({ params, locals }) {
	const show_number = parseInt(params.show_number);
	// Caches and gets show dynamically based on release date
	const show = await cache.shows.show(show_number);

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
