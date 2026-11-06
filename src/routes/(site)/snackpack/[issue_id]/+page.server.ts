import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { CONVERT_KIT_SECRET } from '$app/env/private';
import { edge_cached } from '$server/edge_cache';
import type { Broadcast } from '#lib/newsletter/newsletter.remote.ts';
import { parseSubject } from '#lib/newsletter/parse-subject.ts';

// Wrap the email body in a full document so it renders standalone inside the
// iframe: <base target="_blank"> sends every link to a new tab, and the email's
// own <style> blocks stay isolated from the site.
function asEmailDocument(content: string): string {
	return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base target="_blank"></head><body>${content}</body></html>`;
}

// A sent broadcast doesn't change, so Kit's answer is edge cached for a month. Kit errors throw,
// so they aren't cached as "not found".
async function fetch_broadcast(issue_id: string) {
	const response = await fetch(
		`https://api.convertkit.com/v3/broadcasts/${issue_id}?api_secret=${CONVERT_KIT_SECRET}`
	);
	if (response.status === 404) return null;
	if (!response.ok) throw new Error(`Kit API ${response.status} for broadcast ${issue_id}`);
	const { broadcast } = (await response.json()) as { broadcast?: Broadcast };
	return broadcast ?? null;
}

export const load: PageServerLoad = async function ({ params }) {
	const month = 60 * 60 * 24 * 30;
	const broadcast = await edge_cached(
		`newsletter-issue-${params.issue_id}`,
		{ fresh_seconds: month, stale_seconds: month },
		() => fetch_broadcast(params.issue_id)
	).catch((kit_error: unknown) => {
		console.error('Could not load the Snack Pack issue from Kit', kit_error);
		return null;
	});

	const published_at = broadcast?.published_at || broadcast?.created_at;
	// Only surface broadcasts that are public and already sent.
	if (!broadcast || !broadcast.public || !published_at || new Date(published_at) > new Date()) {
		error(404, `HrM! Broadcast with the id ${params.issue_id} Not found`);
	}

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
