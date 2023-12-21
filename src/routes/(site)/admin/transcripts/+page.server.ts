import {
	cluster_embeddings_action,
	embed_entire_episode_action,
	fetch_embedding_action
} from '$/server/ai/embeddings';
import { import_transcripts } from '$server/transcripts/transcripts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		transcripts: locals.prisma.transcript.findMany({
			select: {
				show_number: true,
				_count: {
					select: {
						utterances: true
					}
				},
				show: {
					select: {
						title: true
					}
				}
			}
		}),
		utterances_with_embeddings: locals.prisma.transcriptUtterance.count({
			where: {
				embedding_set: true
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

	delete_all_transcripts: async ({ locals }) => {
		// Order of these is important because of how db relations work
		// Comment this out for safety
		// await locals.prisma.transcript.deleteMany({});
		return { message: 'Deleted All Transcripts!' };
	},
	fetch_embedding: fetch_embedding_action,
	cluster_embeddings: cluster_embeddings_action,
	embed_entire_episode: embed_entire_episode_action
};
