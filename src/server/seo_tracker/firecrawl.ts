import { as_array, as_number, as_string, read_path } from '#lib/utils/narrow.ts';

// Firecrawl's API, for the SEO tracker. Credits and rate limits are separate: each plan allows so
// many requests a minute, however many credits are left. Alexandria calls count against /scrape's
// limit, so the Spotify pages go as one batch, which has its own.
// Docs: https://docs.firecrawl.dev/rate-limits, https://docs.firecrawl.dev/features/batch-scrape

const BATCH_SCRAPE_URL = 'https://api.firecrawl.dev/v2/batch/scrape';
// A rate-limited request is sent again after Firecrawl's retry_after_seconds, at most this often
const RATE_LIMIT_RETRIES = 3;
// Used when Firecrawl doesn't say how long to wait; its limits are per minute
const DEFAULT_RETRY_AFTER_SECONDS = 30;
const MAX_RETRY_AFTER_SECONDS = 60;
// Spotify's web player fills in its results after the page loads
const RENDER_WAIT_MS = 4000;
export const BATCH_POLL_INTERVAL_MS = 3000;
// 22 Spotify pages took about 10 s on 2026-11-20
const BATCH_TIMEOUT_MS = 5 * 60 * 1000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The seconds a 429 says to wait, from its JSON body's retry_after_seconds. */
async function read_retry_after_seconds(response: Response): Promise<number> {
	const body: unknown = await response.json().catch(() => null);
	const seconds = as_number(read_path(body, ['retry_after_seconds']));
	return Math.min(seconds ?? DEFAULT_RETRY_AFTER_SECONDS, MAX_RETRY_AFTER_SECONDS);
}

/** A Firecrawl request that waits out the per-minute rate limit instead of failing on it. */
export async function fetch_firecrawl(
	url: string,
	init: RequestInit,
	fetch_fn: typeof fetch
): Promise<Response> {
	for (let retry = 0; ; retry++) {
		const response = await fetch_fn(url, init);
		if (response.status !== 429 || retry === RATE_LIMIT_RETRIES) return response;
		await wait((await read_retry_after_seconds(response)) * 1000);
	}
}

async function read_firecrawl_json(response: Response, action: string): Promise<unknown> {
	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Firecrawl ${action} failed (${response.status}): ${body.slice(0, 300)}`);
	}
	return response.json();
}

export type ScrapedPage = { ok: true; markdown: string } | { ok: false; error: string };

function read_page(item: unknown): ScrapedPage {
	const status = as_number(read_path(item, ['metadata', 'statusCode']));
	const markdown = as_string(read_path(item, ['markdown']));
	if (status !== null && status >= 400) return { ok: false, error: `The page answered ${status}` };
	if (markdown === null) {
		const error = as_string(read_path(item, ['metadata', 'error']));
		return { ok: false, error: error ?? 'Firecrawl returned no markdown' };
	}
	return { ok: true, markdown };
}

// The same address however Firecrawl writes it back
function normalize_url(url: string): string {
	return new URL(url).href;
}

/**
 * Reads pages through Firecrawl's batch scrape as markdown, loaded fresh in a browser from a US
 * address. Each page comes back by its URL; one Firecrawl couldn't read has an error instead.
 * Throws when the batch itself fails.
 */
export async function batch_scrape_markdown(
	urls: readonly string[],
	api_key: string,
	fetch_fn: typeof fetch = fetch
): Promise<{ pages: Map<string, ScrapedPage>; credits_cost: number }> {
	const headers = { Authorization: `Bearer ${api_key}`, 'Content-Type': 'application/json' };
	const started = await read_firecrawl_json(
		await fetch_firecrawl(
			BATCH_SCRAPE_URL,
			{
				method: 'POST',
				headers,
				body: JSON.stringify({
					urls,
					formats: ['markdown'],
					waitFor: RENDER_WAIT_MS,
					location: { country: 'US' },
					// Never Firecrawl's cached copy: each snapshot reads the pages as they are now
					maxAge: 0
				})
			},
			fetch_fn
		),
		'batch scrape'
	);
	const batch_id = as_string(read_path(started, ['id']));
	if (batch_id === null) throw new Error('Firecrawl started no batch scrape');

	const read_status = async (status_url: string) =>
		read_firecrawl_json(await fetch_firecrawl(status_url, { headers }, fetch_fn), 'batch status');

	const deadline = Date.now() + BATCH_TIMEOUT_MS;
	let status = await read_status(`${BATCH_SCRAPE_URL}/${batch_id}`);
	while (as_string(read_path(status, ['status'])) === 'scraping') {
		if (Date.now() > deadline) throw new Error('Firecrawl’s batch scrape took over 5 minutes');
		await wait(BATCH_POLL_INTERVAL_MS);
		status = await read_status(`${BATCH_SCRAPE_URL}/${batch_id}`);
	}
	if (as_string(read_path(status, ['status'])) !== 'completed') {
		throw new Error(
			`Firecrawl’s batch scrape ${as_string(read_path(status, ['status'])) ?? 'failed'}`
		);
	}

	// A large batch comes in pages, each linking the next
	const items = as_array(read_path(status, ['data']));
	for (let next = as_string(read_path(status, ['next'])); next !== null; ) {
		const page = await read_status(next);
		items.push(...as_array(read_path(page, ['data'])));
		next = as_string(read_path(page, ['next']));
	}

	const pages = new Map<string, ScrapedPage>();
	for (const item of items) {
		const source_url = as_string(read_path(item, ['metadata', 'sourceURL']));
		if (source_url !== null) pages.set(normalize_url(source_url), read_page(item));
	}
	return {
		pages: new Map(
			urls.map((url): [string, ScrapedPage] => [
				url,
				pages.get(normalize_url(url)) ?? { ok: false, error: 'Firecrawl returned no page' }
			])
		),
		credits_cost: as_number(read_path(status, ['creditsUsed'])) ?? 0
	};
}
