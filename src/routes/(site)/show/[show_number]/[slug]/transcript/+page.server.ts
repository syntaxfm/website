import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';

// Edge cached because pages can't be shared-cached: every page renders for its visitor
// (hooks.server.ts). Fresh for 5 minutes, so fixes made in the admin show up soon.
export const load = async function ({ params, parent }) {
	const show_number = parseInt(params.show_number);

	const transcript = await edge_cached(
		`transcript-lines-2-${show_number}`,
		{ fresh_seconds: 60 * 5, stale_seconds: 60 * 60 * 24 * 30 },
		async () => {
			const episode = await db.query.show.findFirst({
				where: (shows, { eq }) => eq(shows.number, show_number),
				columns: {},
				with: {
					transcript: {
						columns: { id: true },
						with: {
							utterances: {
								columns: { speaker: true, start: true, end: true, transcript_value: true },
								orderBy: (utterances, { asc }) => [asc(utterances.start)]
							}
						}
					}
				}
			});
			return episode?.transcript ?? null;
		}
	);
	if (transcript) return { transcript };

	// Until it's made, the page has nothing for search engines to find
	const { meta } = await parent();
	return { transcript, meta: { ...meta, noindex: true } };
};
