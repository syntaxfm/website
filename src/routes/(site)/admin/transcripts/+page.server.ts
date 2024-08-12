import { prisma_client } from '$/server/prisma-client';
import { import_transcripts } from '$server/transcripts/transcripts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		transcripts: await prisma_client.transcript.findMany({
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
			}
		})
	};
};

export const actions: Actions = {
	import_transcripts: async () => {
		return import_transcripts().catch((err) => {
			console.error(err);
			return err;
		});
	},

	delete_all_transcripts: async () => {
		// Order of these is important because of how db relations work
		await prisma_client.transcript.deleteMany({});
		return { message: 'Deleted All Transcripts!' };
	}
};
