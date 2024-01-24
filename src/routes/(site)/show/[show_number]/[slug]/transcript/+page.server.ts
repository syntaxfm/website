import { transcript_with_utterances } from '$server/ai/queries';
import { get_show_cache_s } from '$utilities/get_show_cache_ms';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ setHeaders, params, locals, parent, url }) {
	const { show } = await parent();
	const cache_ms = get_show_cache_s(show.date);
	setHeaders({
		'cache-control': `public s-max-age=${cache_ms}, stale-while-revalidate=${cache_ms}`
	});
	const { show_number } = params;

	return {
		transcript: await locals.prisma.transcript.findUnique({
			where: { show_number: parseInt(show_number) },
			...transcript_with_utterances
		})
	};
};
