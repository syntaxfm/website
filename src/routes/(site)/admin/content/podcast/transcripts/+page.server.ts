import { db } from '$server/db/client';
import { transcriptUtterance } from '$server/db/schema';
import { inArray, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const transcript_rows = await db.query.transcript.findMany({
		with: {
			show: true
		},
		orderBy: (transcript_item, { desc }) => [desc(transcript_item.show_number)]
	});

	if (transcript_rows.length === 0) {
		return {
			transcripts: []
		};
	}

	const transcript_ids = transcript_rows.map((transcript_item) => transcript_item.id);

	const utterance_counts = await db
		.select({
			transcript_id: transcriptUtterance.transcript_id,
			utterance_count: sql<number>`count(*)`.as('utterance_count')
		})
		.from(transcriptUtterance)
		.where(inArray(transcriptUtterance.transcript_id, transcript_ids))
		.groupBy(transcriptUtterance.transcript_id);

	const utterance_counts_by_id = new Map(
		utterance_counts.map((utterance_count_row) => [
			utterance_count_row.transcript_id,
			Number(utterance_count_row.utterance_count)
		])
	);

	return {
		transcripts: transcript_rows.map((transcript_item) => ({
			...transcript_item,
			utterance_count: utterance_counts_by_id.get(transcript_item.id) ?? 0
		}))
	};
};
