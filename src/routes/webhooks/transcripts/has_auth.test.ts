import { afterEach, describe, expect, it, vi } from 'vitest';

const { private_env } = vi.hoisted(() => ({
	private_env: {} as Record<string, string | undefined>
}));
vi.mock('$app/env/private', () => ({
	get CRON_SECRET() {
		return private_env.CRON_SECRET;
	}
}));

const { has_auth } = await import('./has_auth');

const request = (url: string, authorization?: string) =>
	new Request(url, { headers: authorization ? { authorization } : {} });

afterEach(() => {
	delete private_env.CRON_SECRET;
});

describe('has_auth', () => {
	it('refuses everything when CRON_SECRET is not set, including "Bearer undefined"', () => {
		expect(has_auth(request('https://beta.syntax.fm/webhooks/ai', 'Bearer undefined'))).toBe(false);
		expect(has_auth(request('https://beta.syntax.fm/webhooks/ai?CRON_SECRET='))).toBe(false);
	});

	it('accepts the secret as a bearer token or query parameter', () => {
		private_env.CRON_SECRET = 'real-secret';
		expect(has_auth(request('https://syntax.fm/webhooks/ai', 'Bearer real-secret'))).toBe(true);
		expect(has_auth(request('https://syntax.fm/webhooks/ai?CRON_SECRET=real-secret'))).toBe(true);
	});

	it('refuses a wrong secret', () => {
		private_env.CRON_SECRET = 'real-secret';
		expect(has_auth(request('https://syntax.fm/webhooks/ai', 'Bearer nope'))).toBe(false);
		expect(has_auth(request('https://syntax.fm/webhooks/ai?CRON_SECRET=nope'))).toBe(false);
	});
});
