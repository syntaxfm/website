import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';

// A transcript doesn't change once it's made. Edge cached because pages can't be shared-cached:
// every page renders for its visitor (hooks.server.ts).
export const load = async function ({ params }) {
	const show_number = parseInt(params.show_number);

	return {
		transcript: await edge_cached(
			`transcript-lines-${show_number}`,
			{ fresh_seconds: 60 * 60, stale_seconds: 60 * 60 * 24 * 30 },
			async () =>
				(await db.query.transcript.findFirst({
					where: (transcripts, { eq }) => eq(transcripts.show_number, show_number),
					columns: { show_number: true },
					with: {
						utterances: {
							columns: { speaker: true, start: true, end: true, transcript_value: true },
							orderBy: (utterances, { asc }) => [asc(utterances.start)]
						}
					}
				})) ?? null
		)
	};
};
