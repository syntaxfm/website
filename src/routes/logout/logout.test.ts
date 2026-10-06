import type { RequestEvent } from '@sveltejs/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { private_env } = vi.hoisted(() => ({
	private_env: {} as Record<string, string | undefined>
}));
vi.mock('$env/dynamic/private', () => ({ env: private_env }));

async function load_post(dev: boolean) {
	vi.resetModules();
	vi.doMock('$app/environment', () => ({ dev }));
	return (await import('./+server')).POST;
}

function sign_out_event(
	href: string,
	origin: string | null,
	event_fetch: typeof fetch
): RequestEvent<Record<string, never>, '/logout'> {
	const headers = new Headers({
		Accept: 'text/html',
		'Content-Type': 'application/x-www-form-urlencoded',
		Cookie: 'session=opaque'
	});
	if (origin) headers.set('Origin', origin);
	const url = new URL(href);
	return {
		url,
		request: new Request(url, { method: 'POST', headers }),
		fetch: event_fetch
	} as unknown as RequestEvent<Record<string, never>, '/logout'>;
}

afterEach(() => {
	vi.unstubAllGlobals();
	delete private_env.SYNTAX_AUTH_PUBLIC_ORIGINS;
});

describe('POST /logout', () => {
	it('signs out centrally from the production origin with event.fetch', async () => {
		const POST = await load_post(false);
		const event_fetch = vi.fn<typeof fetch>(async () => new Response(null, { status: 200 }));

		const response = await POST(
			sign_out_event('https://syntax.fm/logout', 'https://syntax.fm', event_fetch)
		);

		expect(event_fetch).toHaveBeenCalledWith(
			'https://auth.syntax.fm/api/auth/sign-out',
			expect.objectContaining({
				headers: expect.objectContaining({ Cookie: 'session=opaque', Origin: 'https://syntax.fm' })
			})
		);
		expect(response.headers.get('Location')).toBe('https://syntax.fm');
	});

	it('signs out in development from a configured HTTPS origin behind a proxy', async () => {
		private_env.SYNTAX_AUTH_PUBLIC_ORIGINS = 'https://dev.example';
		const POST = await load_post(true);
		const cleared = [
			'__Secure-better-auth.session_token=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax',
			'better-auth.session_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax'
		];
		const auth_response = new Response(null, { status: 200 });
		for (const cookie of cleared) auth_response.headers.append('Set-Cookie', cookie);
		const platform_fetch = vi.fn<typeof fetch>(async () => auth_response);
		vi.stubGlobal('fetch', platform_fetch);

		const response = await POST(
			sign_out_event('http://dev.example/logout', 'https://dev.example', vi.fn())
		);

		expect(platform_fetch).toHaveBeenCalledWith(
			'http://localhost:37960/api/auth/sign-out',
			expect.objectContaining({
				headers: expect.objectContaining({
					Cookie: 'session=opaque',
					Origin: 'https://dev.example',
					'x-syntax-auth-dev-origin': 'https://dev.example'
				})
			})
		);
		expect(response.status).toBe(303);
		expect(response.headers.get('Location')).toBe('/');
		expect(response.headers.getSetCookie()).toEqual(cleared);
	});

	it('rejects an HTTPS origin behind a proxy unless it is configured', async () => {
		const POST = await load_post(true);
		const platform_fetch = vi.fn<typeof fetch>();
		vi.stubGlobal('fetch', platform_fetch);

		const response = await POST(
			sign_out_event('http://dev.example/logout', 'https://dev.example', vi.fn())
		);

		expect(response.status).toBe(403);
		expect(platform_fetch).not.toHaveBeenCalled();
	});

	it.each([null, 'https://evil.example'])(
		'rejects a development sign-out with Origin %s',
		async (origin) => {
			const POST = await load_post(true);
			const platform_fetch = vi.fn<typeof fetch>();
			vi.stubGlobal('fetch', platform_fetch);

			const response = await POST(sign_out_event('http://localhost:5740/logout', origin, vi.fn()));

			expect(response.status).toBe(403);
			expect(platform_fetch).not.toHaveBeenCalled();
		}
	);
});
