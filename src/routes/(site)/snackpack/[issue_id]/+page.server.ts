import { error, json } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import type { Broadcast } from '../proxy+page.server';

export const load: PageServerLoad = async function ({ setHeaders, params, locals }) {
	// 1. Fetch a broadcast by this ID
	const response = await fetch(
		`https://api.convertkit.com/v3/broadcasts/${params.issue_id}?api_secret=${env.CONVERT_KIT_SECRET}`
	).then((res) => res.json() as Promise<{ broadcast: Broadcast | undefined }>);
	// 2. Check if the response is valid, public, and in the past
	if (
		!response.broadcast ||
		!response.broadcast.public ||
		new Date(response.broadcast.created_at) > new Date()
	) {
		throw error(404, `HrM! Broadcast with the id ${params.issue_id} Not found`);
	}

	// If we have a response, we can cache it for 30 days
	setHeaders({
		'cache-control': 'public, max-age=2592000, s-maxage=2592000'
	});

	return {
		subject: response.broadcast.subject,
		published_at: response.broadcast.published_at,
		id: response.broadcast.id,
		html: response.broadcast.content,
		meta: {
			title: `Syntax Newsletter - Issue ${response.broadcast.id}`
		}
	};
};
