import { describe, expect, it, vi } from 'vitest';
import { run_alexandria_calls, type AlexandriaCall } from './alexandria';

function call(index: number): AlexandriaCall {
	return {
		provider: 'dataforseo',
		capability: 'serp/google-organic',
		options: { keyword: `k${index}` }
	};
}

function ok_response(items: unknown[]): Response {
	return Response.json({ success: true, data: { alexandria: items, creditsCost: 0 } });
}

describe('run_alexandria_calls', () => {
	it('sends up to 10 calls per request and keeps results in call order', async () => {
		const fetch_fn = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
			const body = JSON.parse(String(init?.body)) as { alexandria: AlexandriaCall[] };
			return ok_response(
				body.alexandria.map((sent) => ({ data: { echo: sent.options.keyword }, creditsCost: 2 }))
			);
		});
		const calls = Array.from({ length: 11 }, (_, index) => call(index));

		const outcomes = await run_alexandria_calls(calls, 'test-key', fetch_fn);

		expect(fetch_fn).toHaveBeenCalledTimes(2);
		const [, first_init] = fetch_fn.mock.calls[0];
		expect(new Headers(first_init?.headers).get('Authorization')).toBe('Bearer test-key');
		expect(outcomes).toHaveLength(11);
		expect(outcomes[10]).toEqual({
			ok: true,
			call: calls[10],
			data: { echo: 'k10' },
			credits_cost: 2
		});
	});

	it('returns a failed call as an outcome, not a throw', async () => {
		const fetch_fn = vi.fn(async () =>
			ok_response([
				{
					provider: 'dataforseo',
					error: { code: 'invalid_option', message: 'bad option', status: 400 }
				}
			])
		);

		const [outcome] = await run_alexandria_calls([call(0)], 'test-key', fetch_fn);

		expect(outcome).toEqual({
			ok: false,
			call: call(0),
			error: { code: 'invalid_option', message: 'bad option' }
		});
	});

	it('throws when the whole request fails', async () => {
		const fetch_fn = vi.fn(async () => new Response('Unauthorized', { status: 401 }));
		await expect(run_alexandria_calls([call(0)], 'bad-key', fetch_fn)).rejects.toThrow(
			'Firecrawl Alexandria request failed (401)'
		);
	});

	it('throws when the result count does not match the calls', async () => {
		const fetch_fn = vi.fn(async () => ok_response([]));
		await expect(run_alexandria_calls([call(0)], 'test-key', fetch_fn)).rejects.toThrow(
			'0 results for 1 calls'
		);
	});
});
