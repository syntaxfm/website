import { redirect } from '@sveltejs/kit';

export const load = async function ({ locals }) {
	if (!locals?.user?.roles?.includes('admin')) redirect(302, '/login');
};
