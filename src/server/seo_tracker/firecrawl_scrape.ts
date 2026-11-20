import { as_number, as_string, read_path } from '#lib/utils/narrow.ts';

// One web page read through Firecrawl's scrape API as markdown, loaded in a browser from a US
// address. Docs: https://docs.firecrawl.dev/api-reference/endpoint/scrape

const SCRAPE_URL = 'https://api.firecrawl.dev/v2/scrape';
// Spotify's web player fills in its results after the page loads
const RENDER_WAIT_MS = 4000;

export type ScrapedPage = { markdown: string; credits_cost: number };

export async function scrape_markdown(
	url: string,
	api_key: string,
	fetch_fn: typeof fetch = fetch
): Promise<ScrapedPage> {
	const response = await fetch_fn(SCRAPE_URL, {
		method: 'POST',
		headers: { Authorization: `Bearer ${api_key}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			url,
			formats: ['markdown'],
			waitFor: RENDER_WAIT_MS,
			location: { country: 'US' },
			// Never Firecrawl's cached copy: each snapshot reads the page as it is now
			maxAge: 0
		})
	});
	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Firecrawl scrape failed (${response.status}): ${body.slice(0, 300)}`);
	}

	const body: unknown = await response.json();
	const page_status = as_number(read_path(body, ['data', 'metadata', 'statusCode']));
	if (page_status !== null && page_status >= 400) {
		throw new Error(`${url} answered ${page_status}`);
	}
	const markdown = as_string(read_path(body, ['data', 'markdown']));
	if (markdown === null) throw new Error(`Firecrawl returned no markdown for ${url}`);
	return {
		markdown,
		credits_cost: as_number(read_path(body, ['data', 'metadata', 'creditsUsed'])) ?? 0
	};
}
