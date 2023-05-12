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
		return { status: 200 };
	},
	delete_all_shows: async ({ locals }) => {
		await locals.prisma.socialLink.deleteMany({});
		await locals.prisma.guest.deleteMany({});
		await locals.prisma.show.deleteMany({});
		return { status: 200 };
	}
};
