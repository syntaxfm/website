import { import_transcripts } from '$db/transcripts/transcripts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  return {
    transcripts: locals.prisma.transcript.findMany({
      include: {
        show: true,
        _count: {
          select: {
            utterances: true
          }
        }
        // utterances: {
        //   // include: {
        //   //   words: true
        //   // }
        // }
      },
    }),
	};
};

export const actions: Actions = {
	import_transcripts: async () => {
    return import_transcripts().catch(err => {
      console.error(err);
      return err;
    });
	},

	delete_all_transcripts: async ({ locals }) => {
		// Order of these is important because of how db relations work
		await locals.prisma.transcript.deleteMany({});
		return { message: 'Deleted All Transcripts!' };
	},
};
