// TODO WES BOS Remove
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// import { transcript_select } from '$server/ai/queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	return {
		show: locals.prisma.show.findUnique({
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
