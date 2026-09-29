import { describe, expect, it, vi } from 'vitest';

// The auth origin is fixed when the module loads, so each build flavor gets its own instance.
async function load_syntax_auth(dev: boolean) {
	vi.resetModules();
	vi.doMock('$app/environment', () => ({ dev }));
	return import('./syntax_auth');
}

const {
	append_set_cookie_headers,
	build_syntax_sign_in_url,
	get_syntax_auth,
	is_trusted_syntax_url,
	sign_out_syntax_auth
} = await load_syntax_auth(false);
const development = await load_syntax_auth(true);

const central_response = {
	user: {
		id: 'central-user-id',
		name: 'Syntax Admin',
		email: 'admin@syntax.fm',
		emailVerified: true,
		image: 'https://avatars.example/admin.png',
		createdAt: '2026-07-24T00:00:00.000Z',
		updatedAt: '2026-07-24T01:00:00.000Z',
		unexpected: 'not copied'
	},
	session: {
		id: 'session-id',
		userId: 'central-user-id',
		expiresAt: '2026-08-24T00:00:00.000Z',
		createdAt: '2026-07-24T00:00:00.000Z',
		updatedAt: '2026-07-24T01:00:00.000Z',
		token: 'must-not-leave-central-auth',
		ipAddress: '192.0.2.1',
		userAgent: 'secret-agent'
	}
};

function response_with_cookies(body: unknown, cookies: string[], status = 200): Response {
	const headers = new Headers({ 'Content-Type': 'application/json' });
	for (const cookie of cookies) {
		headers.append('Set-Cookie', cookie);
	}
	return new Response(JSON.stringify(body), { status, headers });
}

describe('get_syntax_auth', () => {
	it('returns an anonymous context without a cookie', async () => {
		const server_fetch = vi.fn();

		await expect(get_syntax_auth(null, server_fetch)).resolves.toEqual({
			auth: null,
			set_cookie_headers: []
		});
		expect(server_fetch).not.toHaveBeenCalled();
	});

	it('forwards the exact cookie with caching disabled and sanitizes the context', async () => {
		const cookie_header = 'better-auth.session_token=opaque%2Evalue; theme=dark';
		const server_fetch = vi.fn(async () => response_with_cookies(central_response, []));

		const result = await get_syntax_auth(cookie_header, server_fetch);

		expect(server_fetch).toHaveBeenCalledOnce();
		expect(server_fetch).toHaveBeenCalledWith(
			'https://auth.syntax.fm/api/auth/get-session',
			expect.objectContaining({
				cache: 'no-store',
				headers: {
					'Cache-Control': 'no-store',
					Cookie: cookie_header
				}
			})
		);
		expect(result.auth).toEqual({
			user: {
				id: central_response.user.id,
				name: central_response.user.name,
				email: central_response.user.email,
				emailVerified: central_response.user.emailVerified,
				image: central_response.user.image,
				createdAt: central_response.user.createdAt,
				updatedAt: central_response.user.updatedAt
			},
			session: {
				id: central_response.session.id,
				userId: central_response.session.userId,
				expiresAt: central_response.session.expiresAt,
				createdAt: central_response.session.createdAt,
				updatedAt: central_response.session.updatedAt
			}
		});
		expect(result.auth).not.toHaveProperty('session.token');
		expect(result.auth).not.toHaveProperty('session.ipAddress');
		expect(result.auth).not.toHaveProperty('session.userAgent');
		expect(result.auth).not.toHaveProperty('user.unexpected');
	});

	it.each([
		['null', null],
		['missing session', { user: central_response.user }],
		[
			'mismatched identity',
			{ ...central_response, session: { ...central_response.session, userId: 'another-user' } }
		]
	])('treats a %s central response as signed out', async (_label, body) => {
		const server_fetch = vi.fn(async () => response_with_cookies(body, []));
		const result = await get_syntax_auth('cookie=value', server_fetch);

		expect(result.auth).toBeNull();
	});

	it('treats unsuccessful responses as signed out while retaining cookie clears', async () => {
		const clear_cookie = 'better-auth.session_token=; Path=/; Max-Age=0; Secure; HttpOnly';
		const server_fetch = vi.fn(async () =>
			response_with_cookies({ error: true }, [clear_cookie], 401)
		);

		await expect(get_syntax_auth('cookie=value', server_fetch)).resolves.toEqual({
			auth: null,
			set_cookie_headers: [clear_cookie]
		});
	});

	it('treats malformed JSON as signed out', async () => {
		const console_error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const server_fetch = vi.fn(async () => new Response('not JSON'));

		await expect(get_syntax_auth('cookie=value', server_fetch)).resolves.toEqual({
			auth: null,
			set_cookie_headers: []
		});
		expect(console_error).toHaveBeenCalledOnce();
		console_error.mockRestore();
	});
});

describe('Syntax Auth redirects', () => {
	it('uses a valid current Syntax URL as return_to', () => {
		const return_to = new URL('https://syntax.fm/admin/content?status=DRAFT');
		const sign_in_url = build_syntax_sign_in_url(return_to);

		expect(sign_in_url.origin).toBe('https://auth.syntax.fm');
		expect(sign_in_url.pathname).toBe('/sign-in');
		expect(sign_in_url.searchParams.get('return_to')).toBe(return_to.href);
	});

	it.each([
		'http://syntax.fm/admin',
		'https://user:password@syntax.fm/admin',
		'https://syntax.fm.example.com/admin',
		'https://example.com/admin'
	])('ignores an untrusted return URL: %s', (return_to) => {
		const url = new URL(return_to);
		expect(is_trusted_syntax_url(url)).toBe(false);
		expect(build_syntax_sign_in_url(url).searchParams.has('return_to')).toBe(false);
	});

	it('accepts trusted Syntax subdomains', () => {
		expect(is_trusted_syntax_url(new URL('https://admin.syntax.fm/path'))).toBe(true);
	});

	it.each(['http://localhost:5740/admin', 'http://127.0.0.1:5740/admin'])(
		'ignores a local return URL in production builds: %s',
		(return_to) => {
			const url = new URL(return_to);
			expect(is_trusted_syntax_url(url)).toBe(false);
			expect(build_syntax_sign_in_url(url).searchParams.has('return_to')).toBe(false);
		}
	);
});

describe('Syntax Auth in development builds', () => {
	it('signs in through local Syntax Auth and returns to any local port', () => {
		const return_to = new URL('http://localhost:5740/admin/content');
		const sign_in_url = development.build_syntax_sign_in_url(return_to);

		expect(sign_in_url.origin).toBe('http://localhost:37960');
		expect(sign_in_url.pathname).toBe('/sign-in');
		expect(sign_in_url.searchParams.get('return_to')).toBe(return_to.href);
		expect(development.is_trusted_syntax_url(new URL('http://127.0.0.1:4173/'))).toBe(true);
	});

	it.each([
		'http://user:password@localhost:5740/admin',
		'https://localhost.example.com/admin',
		'http://example.com/admin',
		'http://syntax.fm/admin'
	])('still ignores an untrusted return URL: %s', (return_to) => {
		expect(development.is_trusted_syntax_url(new URL(return_to))).toBe(false);
	});

	it('reads the session from local Syntax Auth', async () => {
		const server_fetch = vi.fn(async () => response_with_cookies(central_response, []));
		await development.get_syntax_auth('cookie=value', server_fetch);

		expect(server_fetch).toHaveBeenCalledWith(
			'http://localhost:37960/api/auth/get-session',
			expect.anything()
		);
	});

	it('signs out through local Syntax Auth from a local origin', async () => {
		const server_fetch = vi.fn(async () => response_with_cookies({ success: true }, []));
		const response = await development.sign_out_syntax_auth(
			'better-auth.session_token=opaque',
			new URL('http://localhost:5740'),
			server_fetch
		);

		expect(server_fetch).toHaveBeenCalledWith(
			'http://localhost:37960/api/auth/sign-out',
			expect.objectContaining({
				headers: expect.objectContaining({ Origin: 'http://localhost:5740' })
			})
		);
		expect(response.status).toBe(303);
		expect(response.headers.get('Location')).toBe('http://localhost:5740');
	});
});

describe('Syntax Auth cookies', () => {
	it('preserves every refresh Set-Cookie header separately', () => {
		const cookies = [
			'better-auth.session_token=one; Path=/; Secure; HttpOnly',
			'better-auth.session_data=two; Path=/; Expires=Sat, 25 Jul 2026 00:00:00 GMT; Secure'
		];
		const response = append_set_cookie_headers(new Response(null, { status: 204 }), cookies);

		expect(response.headers.getSetCookie()).toEqual(cookies);
	});

	it('forwards central logout and every cookie clear', async () => {
		const cookies = [
			'better-auth.session_token=; Path=/; Max-Age=0; Secure; HttpOnly',
			'better-auth.session_data=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure'
		];
		const server_fetch = vi.fn(async () => response_with_cookies({ success: true }, cookies));

		const response = await sign_out_syntax_auth(
			'better-auth.session_token=opaque',
			new URL('https://syntax.fm'),
			server_fetch
		);

		expect(server_fetch).toHaveBeenCalledWith('https://auth.syntax.fm/api/auth/sign-out', {
			method: 'POST',
			headers: {
				'Cache-Control': 'no-store',
				Cookie: 'better-auth.session_token=opaque',
				Origin: 'https://syntax.fm'
			},
			cache: 'no-store'
		});
		expect(response.status).toBe(303);
		expect(response.headers.get('Location')).toBe('https://syntax.fm');
		expect(response.headers.getSetCookie()).toEqual(cookies);
	});

	it('rejects logout from a local origin in production builds', async () => {
		const server_fetch = vi.fn();
		const response = await sign_out_syntax_auth(
			'better-auth.session_token=opaque',
			new URL('http://localhost:5740'),
			server_fetch
		);

		expect(response.status).toBe(400);
		expect(server_fetch).not.toHaveBeenCalled();
	});

	it('rejects logout from an untrusted origin without calling central Auth', async () => {
		const server_fetch = vi.fn();
		const response = await sign_out_syntax_auth(
			'better-auth.session_token=opaque',
			new URL('https://syntax.fm.example.com'),
			server_fetch
		);

		expect(response.status).toBe(400);
		expect(server_fetch).not.toHaveBeenCalled();
	});
});
