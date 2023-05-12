import { import_or_update_all_shows } from '$db/shows';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		shows: locals.prisma.show.findMany({ orderBy: { number: 'desc' } })
	};
};

export const actions: Actions = {
	import_all_shows: async () => {
		console.log('🤖 Pod Sync Requested via Admin');
		return import_or_update_all_shows();
	},

	delete_all_shows: async ({ locals }) => {
		await locals.prisma.show.deleteMany({});
		await locals.prisma.socialLink.deleteMany({});
		await locals.prisma.guest.deleteMany({});
		return { message: 'Delete All Shows' };
	}
};
