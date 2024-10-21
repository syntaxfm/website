import { import_or_update_all_changed_shows } from '../../../server/shows';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { has_auth } from '../transcripts/has_auth';
import { error } from 'console';

export const GET: RequestHandler = async function ({ request }) {
	const allowed = has_auth(request);
	if (!allowed) {
		error(401, 'Get outta here - Wrong Cron key or auth header');
	}
	console.log('🤖 Pod Sync Requested via /webhooks/refresh');
	const data = await import_or_update_all_changed_shows();
	return json(data);
};
