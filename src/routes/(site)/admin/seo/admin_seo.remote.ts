import { command, query } from '$app/server';
import { FIRECRAWL_API_KEY } from '$app/env/private';
import { assert_admin } from '$server/auth/request_auth';
import * as seo_dashboard from '$server/seo_tracker/seo_dashboard';
import { take_seo_snapshot } from '$server/seo_tracker/seo_snapshot';
import { error } from '@sveltejs/kit';

export const get_seo_dashboard = query(async () =>
	seo_dashboard.get_seo_dashboard(await assert_admin())
);

export const run_seo_snapshot = command(async () => {
	await assert_admin();
	if (!FIRECRAWL_API_KEY) {
		error(503, 'The SEO tracker is offline: FIRECRAWL_API_KEY is not set');
	}

	try {
		const result = await take_seo_snapshot(FIRECRAWL_API_KEY);
		await get_seo_dashboard().refresh();
		return result;
	} catch (snapshot_error) {
		console.error('SEO snapshot failed', snapshot_error);
		error(
			502,
			snapshot_error instanceof Error ? snapshot_error.message : 'The SEO snapshot failed'
		);
	}
});
