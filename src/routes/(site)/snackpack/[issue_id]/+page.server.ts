import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import type { Broadcast } from '../proxy+page.server';
import { parseHTML } from 'linkedom';
import { super_cache_mang } from '$/server/cache/cache_mang';

export const load: PageServerLoad = async function ({ setHeaders, params }) {
	// 1. Fetch a broadcast by this ID
	const response = await super_cache_mang(`snackpack:issue-${params.issue_id}`, () =>
		fetch(
			`https://api.convertkit.com/v3/broadcasts/${params.issue_id}?api_secret=${env.CONVERT_KIT_SECRET}`
		)
			.then((res) => res.json() as Promise<{ broadcast: Broadcast | undefined }>)
			.catch(() => ({ broadcast: undefined }))
	);
	// 2. Check if the response is valid, public, and in the past
	if (
		!response.broadcast ||
		!response.broadcast.public ||
		new Date(response.broadcast.published_at || response.broadcast.created_at) > new Date()
	) {
		console.log('broadcast not found...');
		error(404, `HrM! Broadcast with the id ${params.issue_id} Not found`);
	}

	// If we have a response, we can cache it for 30 days
	setHeaders({
		'cache-control': 'public, max-age=2592000, s-maxage=2592000'
	});

	// Scope the CSS in the returned HTML
	const { document } = parseHTML(response.broadcast.content);
	const styles: string[] = [];
	document.querySelectorAll('style').forEach((style) => {
		style.remove();
		styles.push(style.innerHTML);
	});

	return {
		subject: response.broadcast.subject,
		published_at: response.broadcast.published_at || response.broadcast.created_at,
		id: response.broadcast.id,
		html: document.toString(),
		styles,
		meta: {
			title: `Syntax Newsletter - Issue ${response.broadcast.id}`
		}
	};
};
