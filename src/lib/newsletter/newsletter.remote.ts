import { query } from '$app/server';
import { CONVERT_KIT_V4_API_KEY, CONVERT_KIT_SECRET } from '$app/env/private';
import { parseSubject } from './parse-subject';
import { edge_cached } from '$server/edge_cache';

const numberformatter = new Intl.NumberFormat('en-US');

function formatNumber(n: number) {
	return `${numberformatter.format(n)}`;
}

export type Broadcast = {
	id: number;
	publication_id: string;
	created_at: string;
	subject: string;
	description: string;
	content: string;
	public: boolean;
	published_at: string | null;
	send_at: string | null;
	thumbnail_alt: string | null;
	thumbnail_url: string | null;
	email_address: string;
	email_layout_template: string;
};

export type Pagination = {
	has_previous_page: boolean;
	has_next_page: boolean;
	start_cursor: string;
	end_cursor: string;
	per_page: number;
};

export type NewsletterIssue = {
	id: number;
	issue_number: number | null;
	title: string;
	published_at: string;
};

type BroadCastResponse = {
	broadcasts: Broadcast[];
	pagination: Pagination;
};

async function fetch_kit_json<T>(url: string, headers?: HeadersInit): Promise<T> {
	const response = await fetch(url, { headers });
	if (!response.ok) throw new Error(`Kit API ${response.status} for ${new URL(url).pathname}`);
	return (await response.json()) as T;
}

async function fetch_broadcast_list(api_key: string) {
	const results: NewsletterIssue[] = [];
	const now = new Date();
	const start = new Date(2022, 0, 1);
	let after = '';
	let has_next_page = true;
	// Kit pages broadcasts 50 at a time, so the full archive is several sequential requests
	while (has_next_page) {
		const params = new URLSearchParams(after ? { after } : {});
		const page = await fetch_kit_json<BroadCastResponse>(
			`https://api.convertkit.com/v4/broadcasts?${params.toString()}`,
			{ 'X-Kit-Api-Key': api_key }
		);
		for (const {
			id,
			published_at,
			created_at,
			send_at,
			subject,
			public: is_public
		} of page.broadcasts) {
			const date = new Date(published_at || created_at);
			const is_published = is_public && send_at && date >= start && date <= now;
			const title = subject.toLowerCase();
			const is_snackpack_issue = title.includes('snack pack') || title.includes('issue #');
			if (is_published && is_snackpack_issue) {
				results.push({ id, published_at: published_at || created_at, ...parseSubject(subject) });
			}
		}
		has_next_page = page.pagination.has_next_page;
		after = page.pagination.end_cursor;
	}

	return results.sort(
		(a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
	);
}

const NO_KIT_KEY_ISSUES: NewsletterIssue[] = [
	{
		published_at: new Date().toUTCString(),
		issue_number: 1337,
		title: 'ConvertKit API key not set (this is a fake issue)',
		id: 1337
	}
];

export const get_newsletter_archive = query(async () => {
	if (!CONVERT_KIT_SECRET) return { count: '', issues: NO_KIT_KEY_ISSUES };
	const api_key = CONVERT_KIT_V4_API_KEY;
	if (!api_key) {
		console.error('CONVERT_KIT_V4_API_KEY is not set, so the Snack Pack archive is empty');
		return { count: '', issues: [] };
	}

	try {
		// A new issue goes out about every two weeks
		return await edge_cached(
			'newsletter-archive',
			{ fresh_seconds: 60 * 60 * 6, stale_seconds: 60 * 60 * 24 * 30 },
			async () => {
				const [subscribers, issues] = await Promise.all([
					fetch_kit_json<{ total_subscribers?: number }>(
						`https://api.convertkit.com/v3/subscribers?api_secret=${CONVERT_KIT_SECRET}`
					),
					fetch_broadcast_list(api_key)
				]);
				const count =
					typeof subscribers.total_subscribers === 'number'
						? formatNumber(subscribers.total_subscribers)
						: '';
				return { count, issues };
			}
		);
	} catch (error) {
		console.error('Could not load the Snack Pack archive from Kit', error);
		return { count: '', issues: [] };
	}
});
