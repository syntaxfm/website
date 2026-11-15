import { chunk } from '#lib/utils/chunk.ts';
import { as_array, as_number, as_string, is_record, read_path } from '#lib/utils/narrow.ts';

// Firecrawl Alexandria: one API key for third-party data providers (DataForSEO, YouTube search).
// Each call is { provider, capability, options } sent to /v2/scrape with no url.
// Docs: https://docs.firecrawl.dev/features/alexandria

const ALEXANDRIA_URL = 'https://api.firecrawl.dev/v2/scrape';
// Calls sent together in one request
const CALLS_PER_REQUEST = 10;

export type AlexandriaCall = {
	provider: string;
	capability: string;
	options: Record<string, unknown>;
};

export type AlexandriaOutcome =
	| { ok: true; call: AlexandriaCall; data: unknown; credits_cost: number }
	| { ok: false; call: AlexandriaCall; error: { code: string; message: string } };

// One item of data.alexandria[]: the item carries its own error, so a 200 response can still
// hold failed calls (bad options, terms not accepted, provider down).
export function read_alexandria_item(call: AlexandriaCall, item: unknown): AlexandriaOutcome {
	const error = read_path(item, ['error']);
	if (error !== undefined && error !== null) {
		return {
			ok: false,
			call,
			error: {
				code: as_string(read_path(error, ['code'])) ?? 'unknown_error',
				message: as_string(read_path(error, ['message'])) ?? JSON.stringify(error)
			}
		};
	}
	if (!is_record(item) || !('data' in item)) {
		return {
			ok: false,
			call,
			error: { code: 'missing_data', message: 'Alexandria returned an item with no data' }
		};
	}
	return { ok: true, call, data: item.data, credits_cost: as_number(item.creditsCost) ?? 0 };
}

async function send_alexandria_request(
	calls: AlexandriaCall[],
	api_key: string,
	fetch_fn: typeof fetch
): Promise<AlexandriaOutcome[]> {
	const response = await fetch_fn(ALEXANDRIA_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${api_key}`,
			'Content-Type': 'application/json',
			'x-request-id': crypto.randomUUID()
		},
		body: JSON.stringify({ alexandria: calls })
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(
			`Firecrawl Alexandria request failed (${response.status}): ${body.slice(0, 300)}`
		);
	}

	const body: unknown = await response.json();
	const items = as_array(read_path(body, ['data', 'alexandria']));
	if (items.length !== calls.length) {
		throw new Error(
			`Firecrawl Alexandria returned ${items.length} results for ${calls.length} calls`
		);
	}
	return calls.map((call, index) => read_alexandria_item(call, items[index]));
}

// Runs every call, in parallel requests of up to 10. A whole request failing (bad key, no
// credits) throws; a single call failing comes back as { ok: false }.
export async function run_alexandria_calls(
	calls: readonly AlexandriaCall[],
	api_key: string,
	fetch_fn: typeof fetch = fetch
): Promise<AlexandriaOutcome[]> {
	const results = await Promise.all(
		chunk(calls, CALLS_PER_REQUEST).map((batch) =>
			send_alexandria_request(batch, api_key, fetch_fn)
		)
	);
	return results.flat();
}
