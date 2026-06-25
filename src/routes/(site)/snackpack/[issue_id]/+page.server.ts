import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import type { Broadcast } from '$lib/newsletter/newsletter.remote';
import { parseSubject } from '$lib/newsletter/parse-subject';

// Wrap the email body in a full document so it renders standalone inside the
// iframe: <base target="_blank"> sends every link to a new tab, and the email's
// own <style> blocks stay isolated from the site.
function asEmailDocument(content: string): string {
	return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base target="_blank"></head><body>${content}</body></html>`;
}

export const load: PageServerLoad = async function ({ setHeaders, params }) {
	// Fetch the real broadcast for this issue from Kit (ConvertKit).
	const response = await fetch(
		`https://api.convertkit.com/v3/broadcasts/${params.issue_id}?api_secret=${env.CONVERT_KIT_SECRET}`
	)
		.then((res) => res.json() as Promise<{ broadcast: Broadcast | undefined }>)
		.catch(() => ({ broadcast: undefined }));

	const broadcast = response.broadcast;
	const published_at = broadcast?.published_at || broadcast?.created_at;
	// Only surface broadcasts that are public and already sent.
	if (!broadcast || !broadcast.public || !published_at || new Date(published_at) > new Date()) {
		error(404, `HrM! Broadcast with the id ${params.issue_id} Not found`);
	}

	// Real, immutable broadcasts can cache for 30 days.
	setHeaders({ 'cache-control': 'public, max-age=2592000, s-maxage=2592000' });

	// The email already carries the Snack Pack branding, so show the issue's own
	// title (stripped of the redundant "Snack Pack" / "Issue #" boilerplate).
	const { title } = parseSubject(broadcast.subject);

	return {
		id: broadcast.id,
		title,
		published_at,
		html: asEmailDocument(broadcast.content),
		meta: {
			title: `${title} — Syntax Snack Pack`
		}
	};
};
