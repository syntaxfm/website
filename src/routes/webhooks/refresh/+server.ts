import { import_or_update_all_changed_shows } from '../../../server/shows';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async function () {
	console.log('🤖 Pod Sync Requested via /webhooks/refresh');
	const data = await import_or_update_all_changed_shows();
	return json(data);
};
