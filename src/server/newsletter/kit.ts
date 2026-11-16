// Kit (ConvertKit) API calls for the Snack Pack newsletter
import { parseSubject } from '#lib/newsletter/parse-subject.ts';

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

type BroadcastPage = {
	broadcasts: Broadcast[];
	pagination: { has_next_page: boolean; end_cursor: string };
};

export type KitSnackPackIssue = {
	// Kit's broadcast id, as text: it is the newsletter_issues primary key
	id: string;
	issue_number: number | null;
	title: string;
	published_at: Date;
};

// Issues before 2022 went out under an older format and aren't part of the archive
const ARCHIVE_START = new Date(2022, 0, 1);

export async function fetch_kit_json<T>(url: string, headers?: HeadersInit): Promise<T> {
	const response = await fetch(url, { headers });
	if (!response.ok) throw new Error(`Kit API ${response.status} for ${new URL(url).pathname}`);
	return (await response.json()) as T;
}

export async function post_to_kit(path: string, api_key: string, body: Record<string, unknown>) {
	const response = await fetch(`https://api.kit.com${path}`, {
		method: 'POST',
		headers: { 'X-Kit-Api-Key': api_key, 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!response.ok) throw new Error(`Kit API ${response.status} for ${path}`);
}

// A broadcast is a Snack Pack issue once it's public, sent, and named like one. Other broadcasts
// (announcements, sponsor sends) share the same Kit account.
export function to_snackpack_issue(broadcast: Broadcast, now: Date): KitSnackPackIssue | null {
	const published_at = new Date(broadcast.published_at || broadcast.created_at);
	const is_sent =
		broadcast.public &&
		Boolean(broadcast.send_at) &&
		published_at >= ARCHIVE_START &&
		published_at <= now;
	const subject = broadcast.subject.toLowerCase();
	const is_snackpack = subject.includes('snack pack') || subject.includes('issue #');
	if (!is_sent || !is_snackpack) return null;
	return { id: String(broadcast.id), published_at, ...parseSubject(broadcast.subject) };
}

export async function fetch_snackpack_issues(api_key: string): Promise<KitSnackPackIssue[]> {
	const now = new Date();
	const issues: KitSnackPackIssue[] = [];
	let after = '';
	let has_next_page = true;
	// Kit defaults to 50 per page; 500 gets the whole archive in one request (2.4 s → 1.3 s)
	while (has_next_page) {
		const params = new URLSearchParams({ per_page: '500', ...(after ? { after } : {}) });
		const page = await fetch_kit_json<BroadcastPage>(
			`https://api.convertkit.com/v4/broadcasts?${params.toString()}`,
			{ 'X-Kit-Api-Key': api_key }
		);
		for (const broadcast of page.broadcasts) {
			const issue = to_snackpack_issue(broadcast, now);
			if (issue) issues.push(issue);
		}
		has_next_page = page.pagination.has_next_page;
		after = page.pagination.end_cursor;
	}
	return issues;
}
