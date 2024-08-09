import type { AiShowNote } from '@prisma/client';
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { cache } from '$/server/cache/cache';

type AiShowNoteUpdate = Pick<AiShowNote, 'title' | 'description'>;

export const actions = {
	default: async ({ locals, params }) => {
		const data = locals.form_data as AiShowNoteUpdate;
		if (!data.title.trim()) {
			return fail(400, { message: 'AI title cannot be empty.' });
		}
		if (!data.description.trim()) {
			return fail(400, { message: 'AI description cannot be empty.' });
		}

		const show_number = parseInt(params.show_number);
		await locals.prisma.aiShowNote.update({
			where: {
				show_number
			},
			data: {
				title: data.title,
				description: data.description
			}
		});

		await cache.shows.drop_show_cache(show_number);

		return { success: true };
	}
} satisfies Actions;

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
