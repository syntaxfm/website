import { import_or_update_all_shows } from '$db/shows';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async function () {
	console.log('🤖 Pod Sync Requested via /webhooks/refresh');
	const data = await import_or_update_all_shows();
	return json(data);
};
