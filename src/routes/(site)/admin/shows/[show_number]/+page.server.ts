import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	return {
		show: await locals.prisma.show.findUnique({
			where: {
				number: parseInt(params.show_number)
			},
			include: {
				aiShowNote: {
					include: {
						links: true,
						summary: true,
						topics: true,
						tweets: true
					}
				},
				// transcript: transcript_select,
				guests: true
			}
		})
	};
};
