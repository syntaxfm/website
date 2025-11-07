import { db } from '$server/db/client';
import { get_show_cache_s } from '$utilities/get_show_cache_ms';

export const load = async function ({ setHeaders, params, parent }) {
	const { show } = await parent();
	const cache_ms = get_show_cache_s(show.date);
	setHeaders({
		'cache-control': `public, s-maxage=${cache_ms}, stale-while-revalidate=${cache_ms}`
	});
	const { show_number } = params;

	return {
		transcript: await db.query.transcript.findFirst({
			where: (transcripts, { eq }) => eq(transcripts.show_number, parseInt(show_number)),
			with: {
				utterances: true
			}
		})
	};
};
