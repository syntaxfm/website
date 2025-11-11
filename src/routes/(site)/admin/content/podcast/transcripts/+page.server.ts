import { db } from '$server/db/client';
import { transcript, transcriptUtterance } from '$server/db/schema';
import { import_transcripts } from '$server/transcripts/transcripts';
import type { Actions } from './$types';
import { sql } from 'drizzle-orm';

export const load = async () => {
	return {
		transcripts: await db.query.transcript.findMany({
			with: {
				show: true
			},
			extras: {
				utterance_count:
					sql<number>`(SELECT COUNT(*) FROM ${transcriptUtterance} WHERE ${transcriptUtterance.transcriptId} = ${transcript.id})`.as(
						'utterance_count'
					)
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
		await db.delete(transcripts);
		return { message: 'Deleted All Transcripts!' };
	}
};
