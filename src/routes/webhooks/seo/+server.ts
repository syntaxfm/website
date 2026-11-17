import { error, json } from '@sveltejs/kit';
import { FIRECRAWL_API_KEY } from '$app/env/private';
import { take_seo_snapshot } from '$server/seo_tracker/seo_snapshot';
import { has_auth } from '../transcripts/has_auth';

// The weekly SEO snapshot (workers/scheduled_jobs.ts runs it every Monday), the same one the
// Take snapshot button on /admin/seo takes
export const GET = async function seo_snapshot_cron({ request }) {
	if (!has_auth(request)) error(401, 'Get outta here - Wrong Cron key or auth header');
	if (!FIRECRAWL_API_KEY) error(503, 'The SEO tracker is offline: FIRECRAWL_API_KEY is not set');

	const result = await take_seo_snapshot(FIRECRAWL_API_KEY);
	const message = `SEO snapshot ${result.id}: ${result.credits_cost} credits, ${result.error_count} failed calls`;
	console.log(message);
	return json({ message, ...result });
};
