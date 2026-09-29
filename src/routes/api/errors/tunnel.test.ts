import type { RequestEvent } from '@sveltejs/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST } from './+server';

const DSN = 'https://public-key@o4505358925561856.ingest.sentry.io/4505358945419264';

function envelope_with_binary_item(dsn: string): Uint8Array<ArrayBuffer> {
	const text = new TextEncoder().encode(
		`${JSON.stringify({ dsn })}\n${JSON.stringify({ type: 'replay_recording', length: 4 })}\n`
	);
	// Not valid UTF-8, like a compressed replay recording.
	const binary = new Uint8Array([0x78, 0x9c, 0xff, 0xfe]);
	const envelope = new Uint8Array(text.length + binary.length);
	envelope.set(text);
	envelope.set(binary, text.length);
	return envelope;
}

function post(body: Uint8Array<ArrayBuffer>): Promise<Response> {
	const request = new Request('http://localhost/api/errors', { method: 'POST', body });
	return POST({ request } as RequestEvent) as Promise<Response>;
}

describe('Sentry tunnel', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('forwards a binary envelope to Sentry byte-for-byte', async () => {
		const upstream_fetch = vi.fn(async () => new Response(null, { status: 200 }));
		vi.stubGlobal('fetch', upstream_fetch);
		const envelope = envelope_with_binary_item(DSN);

		const response = await post(envelope);

		expect(response.status).toBe(200);
		expect(upstream_fetch).toHaveBeenCalledWith(
			'https://o4505358925561856.ingest.sentry.io/api/4505358945419264/envelope/',
			expect.objectContaining({
				method: 'POST',
				headers: { 'Content-Type': 'application/x-sentry-envelope' }
			})
		);
		const [, init] = upstream_fetch.mock.calls[0] as unknown as [string, RequestInit];
		expect(init.body).toEqual(envelope);
	});

	it.each([
		['another Sentry project', DSN.replace('4505358945419264', '1')],
		['another Sentry host', DSN.replace('o4505358925561856.ingest.sentry.io', 'example.com')]
	])('rejects %s without forwarding', async (_label, dsn) => {
		const console_error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const upstream_fetch = vi.fn();
		vi.stubGlobal('fetch', upstream_fetch);

		const response = await post(envelope_with_binary_item(dsn));

		expect(response.status).toBe(500);
		expect(upstream_fetch).not.toHaveBeenCalled();
		console_error.mockRestore();
	});
});
