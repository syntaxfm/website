import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ locals }) {
	if (!locals?.user?.roles?.includes('admin')) throw redirect(302, '/');
};
