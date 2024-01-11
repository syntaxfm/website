import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from '../../shows/$types';

export const load: PageServerLoad = async function () {
	// They visited /show, redirect to /shows
	redirect(302, `/shows`);
};
