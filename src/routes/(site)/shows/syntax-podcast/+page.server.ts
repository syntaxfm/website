import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The old podcast landing, then /shows, is now /videos. Straight there, not through /shows.
export const load: PageServerLoad = ({ url }) => {
	redirect(301, '/videos' + url.search);
};
