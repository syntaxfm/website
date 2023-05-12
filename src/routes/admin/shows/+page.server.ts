import { get_shows_from_folder } from '$db/shows';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		shows: locals.prisma.show.findMany({ orderBy: { number: 'desc' } })
	};
};

export const actions: Actions = {
	import_all_shows: async () => {
		await get_shows_from_folder();
		return { message: 'Import All Shows' };
	},
	delete_all_shows: async ({ locals }) => {
		await locals.prisma.show.deleteMany({});
		await locals.prisma.socialLink.deleteMany({});
		await locals.prisma.guest.deleteMany({});
		return { message: 'Delete All Shows' };
	}
};
