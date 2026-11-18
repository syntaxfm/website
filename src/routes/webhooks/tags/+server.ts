import { error, json } from '@sveltejs/kit';
import { tag_next_content, TagEngineNotReadyError } from '$server/tags/auto_tag';
import { has_auth } from '../transcripts/has_auth';

// workers/scheduled_jobs.ts runs this hourly, after the video sync and caption import: new episodes
// and videos get their topics and libraries, and items tagged before their transcript existed are
// tagged again from it (src/server/tags/auto_tag.ts). About 2 cents an item. ?limit= runs a bigger
// batch by hand, for the backfill.
const ITEMS_PER_RUN = 10;
const MAX_ITEMS_PER_RUN = 50;

export const GET = async function tag_cron({ request, url }) {
	if (!has_auth(request)) error(401, 'Get outta here - Wrong Cron key or auth header');
	const requested = Number.parseInt(url.searchParams.get('limit') ?? '', 10);
	const limit = Number.isFinite(requested)
		? Math.min(MAX_ITEMS_PER_RUN, Math.max(1, requested))
		: ITEMS_PER_RUN;

	try {
		const { tagged, failed } = await tag_next_content(limit);
		const message = `Tags: ${tagged} items tagged, ${failed} failed`;
		console.log(message);
		return json({ message, tagged, failed });
	} catch (run_error) {
		if (run_error instanceof TagEngineNotReadyError) {
			error(503, `Tagging is offline: ${run_error.message}`);
		}
		throw run_error;
	}
};
