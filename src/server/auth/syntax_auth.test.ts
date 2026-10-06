import { createRequire } from 'node:module';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { private_env } = vi.hoisted(() => ({
	private_env: {} as Record<string, string | undefined>
}));
vi.mock('$env/dynamic/private', () => ({ env: private_env }));

// The auth origin is fixed when the module loads, so each build flavor gets its own instance.
async function load_syntax_auth(dev: boolean) {
	vi.resetModules();
	vi.doMock('$app/environment', () => ({ dev }));
	return import('./syntax_auth');
}

const {
	append_set_cookie_headers,
	as_data_request_response,
	as_remote_request_response,
	get_sign_in_redirect,
	get_sign_in_return_to,
	get_syntax_auth,
	is_trusted_syntax_url,
	sign_in_redirect_response,
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

		await expect(get_syntax_auth(null, server_fetch, { required: true })).resolves.toEqual({
			auth: null,
			set_cookie_headers: [],
			failure: null
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
			set_cookie_headers: [clear_cookie],
			failure: null
		});
	});

	it('treats malformed JSON as signed out without logging the body', async () => {
		const console_error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const server_fetch = vi.fn(async () => new Response('not JSON secret-body'));

		await expect(get_syntax_auth('cookie=value', server_fetch)).resolves.toEqual({
			auth: null,
			set_cookie_headers: [],
			failure: null
		});
		expect(console_error).toHaveBeenCalledOnce();
		expect(JSON.stringify(console_error.mock.calls)).not.toContain('secret-body');
		console_error.mockRestore();
	});

	it('treats a refused request as signed out without logging the error', async () => {
		const console_error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const server_fetch = vi.fn(async () => {
			throw new TypeError('fetch failed cookie=value');
		});

		await expect(get_syntax_auth('cookie=value', server_fetch)).resolves.toEqual({
			auth: null,
			set_cookie_headers: [],
			failure: null
		});
		expect(console_error).toHaveBeenCalledWith('Syntax Auth session request failed');
		console_error.mockRestore();
	});

	it('keeps production timing: no development deadline, one request', async () => {
		vi.useFakeTimers();
		const server_fetch = vi.fn(() => new Promise<Response>(() => undefined));
		let settled = false;
		void get_syntax_auth('cookie=value', server_fetch).then(() => (settled = true));

		await vi.advanceTimersByTimeAsync(60_000);
		expect(settled).toBe(false);
		expect(server_fetch).toHaveBeenCalledOnce();
		vi.useRealTimers();
	});
});

describe('Syntax Auth redirects', () => {
	it('uses a valid current Syntax URL as return_to', () => {
		const return_to = new URL('https://syntax.fm/admin/content?status=DRAFT');
		const { location, headers } = get_sign_in_redirect(return_to);
		const sign_in_url = new URL(location);

		expect(sign_in_url.origin).toBe('https://auth.syntax.fm');
		expect(sign_in_url.pathname).toBe('/sign-in');
		expect(sign_in_url.searchParams.get('return_to')).toBe(return_to.href);
		expect(headers).toEqual({});
	});

	it('answers a production sign-in redirect with only its Location', () => {
		const response = sign_in_redirect_response(new URL('https://syntax.fm/admin'));

		expect(response.status).toBe(302);
		expect([...response.headers.keys()]).toEqual(['location']);
		expect(new URL(response.headers.get('Location') ?? '').origin).toBe('https://auth.syntax.fm');
	});

	it.each([
		['/admin?x=1', 'https://syntax.fm/admin?x=1'],
		['https://admin.syntax.fm/x', 'https://admin.syntax.fm/x'],
		['https://evil.example/x', 'https://syntax.fm/'],
		['//evil.example/x', 'https://syntax.fm/'],
		['http://syntax.fm/x', 'https://syntax.fm/'],
		['http://[bad', 'https://syntax.fm/'],
		[null, 'https://syntax.fm/']
	])('returns production /login to a trusted URL only: %s', (requested, expected) => {
		expect(get_sign_in_return_to(requested, new URL('https://syntax.fm/login')).href).toBe(
			expected
		);
	});

	it.each([
		'http://syntax.fm/admin',
		'https://user:password@syntax.fm/admin',
		'https://syntax.fm.example.com/admin',
		'https://example.com/admin'
	])('ignores an untrusted return URL: %s', (return_to) => {
		const url = new URL(return_to);
		expect(is_trusted_syntax_url(url)).toBe(false);
		expect(new URL(get_sign_in_redirect(url).location).searchParams.has('return_to')).toBe(false);
	});

	it('accepts trusted Syntax subdomains', () => {
		expect(is_trusted_syntax_url(new URL('https://admin.syntax.fm/path'))).toBe(true);
	});

	it.each(['http://localhost:5740/admin', 'http://127.0.0.1:5740/admin'])(
		'ignores a local return URL in production builds: %s',
		(return_to) => {
			const url = new URL(return_to);
			expect(is_trusted_syntax_url(url)).toBe(false);
			expect(new URL(get_sign_in_redirect(url).location).searchParams.has('return_to')).toBe(false);
		}
	);
});

describe('as_data_request_response', () => {
	it.each([301, 302, 303, 307, 308])(
		'turns a development %i into the JSON redirect a data request expects',
		async (status) => {
			const response = development.as_data_request_response(
				new Response(null, { status, headers: { Location: '/__syntax_auth/sign-in' } })
			);

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/json');
			expect(response.headers.get('Cache-Control')).toBe('private, no-store');
			expect(await response.json()).toEqual({
				type: 'redirect',
				location: '/__syntax_auth/sign-in'
			});
		}
	);

	it.each([
		['a 403', new Response('Forbidden', { status: 403 })],
		['a 503', new Response('{}', { status: 503 })],
		['a redirect without Location', new Response(null, { status: 302 })]
	])('leaves %s alone in development', (_label, response) => {
		expect(development.as_data_request_response(response)).toBe(response);
	});

	it('leaves every production response to SvelteKit', () => {
		const response = sign_in_redirect_response(new URL('https://syntax.fm/admin'));

		expect(as_data_request_response(response)).toBe(response);
	});
});

describe('as_remote_request_response', () => {
	const kit_root = path.dirname(
		createRequire(import.meta.url).resolve('@sveltejs/kit/package.json')
	);

	// SvelteKit's own encoding of a remote function's result (`stringify` in its runtime shared
	// module, which its remote handler uses), loaded from the installed source.
	async function kit_stringify(data: unknown): Promise<unknown> {
		const module: unknown = await import(
			/* @vite-ignore */ path.join(kit_root, 'src/runtime/shared.js')
		);
		const stringify: unknown =
			typeof module === 'object' && module !== null ? Reflect.get(module, 'stringify') : undefined;
		if (typeof stringify !== 'function')
			throw new Error('The installed SvelteKit has no stringify');
		return stringify(data, {});
	}

	it.each([
		[302, `/__syntax_auth/sign-in?${new URLSearchParams({ return_to: '/admin?a=1&b="x"' })}`],
		[303, '/__syntax_auth_unavailable?reason=status&status=503&return_to=%2Fadmin'],
		[307, '/']
	])(
		'turns a development %i into the result SvelteKit sends when a remote function redirects',
		async (status, location) => {
			const response = development.as_remote_request_response(
				new Response(null, { status, headers: { Location: location } })
			);

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/json');
			expect(response.headers.get('Cache-Control')).toBe('private, no-store');
			expect(await response.json()).toEqual({
				type: 'result',
				data: await kit_stringify({ redirect: location })
			});
		}
	);

	it.each([
		['a 403', new Response('Forbidden', { status: 403 })],
		['a 503', new Response('{}', { status: 503 })],
		['a redirect without Location', new Response(null, { status: 302 })]
	])('leaves %s alone in development', (_label, response) => {
		expect(development.as_remote_request_response(response)).toBe(response);
	});

	it('leaves every production response alone', () => {
		const response = sign_in_redirect_response(new URL('https://syntax.fm/admin'));

		expect(as_remote_request_response(response)).toBe(response);
	});
});

describe('syntax_auth_remote_failure_response', () => {
	const page = new URL('http://localhost:5740/admin?tab=stats');
	const failure = { kind: 'status', status: 502 } as const;

	it('sends a development remote read to the diagnostic page', async () => {
		const response = development.syntax_auth_remote_failure_response(
			new Request('http://localhost:5740/_app/remote/hash/get_dashboard'),
			failure,
			page
		);

		const body: unknown = await response.json();
		expect(body).toEqual({
			type: 'result',
			data: JSON.stringify([
				{ redirect: 1 },
				'/__syntax_auth_unavailable?reason=status&status=502&return_to=%2Fadmin%3Ftab%3Dstats'
			])
		});
	});

	// A POST may be a command, a form, or a query.batch read: the hook can't tell which, so none
	// is redirected.
	it.each(['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'])(
		'gives a development %s the fix as a 503 error result, never a redirect',
		async (method) => {
			const response = development.syntax_auth_remote_failure_response(
				new Request('http://localhost:5740/_app/remote/hash/save', { method }),
				failure,
				page
			);

			expect(response.status).toBe(200);
			expect(response.headers.get('Location')).toBeNull();
			expect(response.headers.get('Cache-Control')).toBe('private, no-store');
			expect(await response.json()).toEqual({
				type: 'error',
				status: 503,
				error: {
					message:
						'Syntax Auth couldn’t check your sign-in. Local Syntax Auth answered with HTTP ' +
						'status 502. Make sure Docker Desktop (or OrbStack) is running, then stop this dev ' +
						'server and start it again with pnpm dev. Starting it starts local Syntax Auth and ' +
						'prints any problem that remains.'
				}
			});
		}
	);
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
			sign_out_request('https://syntax.fm', 'better-auth.session_token=opaque'),
			new URL('https://syntax.fm/logout'),
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

	it('answers 502 when central logout fails in production', async () => {
		const console_error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const server_fetch = vi.fn(async () => {
			throw new TypeError('fetch failed');
		});

		const response = await sign_out_syntax_auth(
			sign_out_request('https://syntax.fm', 'better-auth.session_token=opaque'),
			new URL('https://syntax.fm/logout'),
			server_fetch
		);

		expect(response.status).toBe(502);
		expect(console_error).toHaveBeenCalledWith('Syntax Auth sign-out request failed');
		console_error.mockRestore();
	});

	it('rejects logout from a local origin in production builds', async () => {
		const server_fetch = vi.fn();
		const response = await sign_out_syntax_auth(
			sign_out_request('http://localhost:5740', 'better-auth.session_token=opaque'),
			new URL('http://localhost:5740/logout'),
			server_fetch
		);

		expect(response.status).toBe(400);
		expect(server_fetch).not.toHaveBeenCalled();
	});

	it('rejects logout from an untrusted origin without calling central Auth', async () => {
		const server_fetch = vi.fn();
		const response = await sign_out_syntax_auth(
			sign_out_request('https://syntax.fm.example.com', 'better-auth.session_token=opaque'),
			new URL('https://syntax.fm.example.com/logout'),
			server_fetch
		);

		expect(response.status).toBe(400);
		expect(server_fetch).not.toHaveBeenCalled();
	});
});

function sign_out_request(
	origin: string | null,
	cookie: string | null,
	accept = 'text/html,application/xhtml+xml'
): Request {
	const headers = new Headers({
		Accept: accept,
		'Content-Type': 'application/x-www-form-urlencoded'
	});
	if (origin) headers.set('Origin', origin);
	if (cookie) headers.set('Cookie', cookie);
	return new Request('http://dev-server.invalid/logout', { method: 'POST', headers });
}

function stalled_body_response(): Response {
	return new Response(new ReadableStream({ start: () => undefined }), {
		headers: { 'Content-Type': 'application/json' }
	});
}

describe('Syntax Auth in development builds', () => {
	const platform_fetch = vi.fn<typeof fetch>();
	const event_fetch = vi.fn<typeof fetch>();
	let console_error: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		platform_fetch.mockReset();
		event_fetch.mockReset();
		vi.stubGlobal('fetch', platform_fetch);
		console_error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		delete private_env.SYNTAX_AUTH_PUBLIC_ORIGINS;
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		console_error.mockRestore();
	});

	function logged(): string {
		return JSON.stringify(console_error.mock.calls);
	}

	describe('sign-in', () => {
		it.each([
			['http://localhost:5740/admin/content?status=DRAFT', '/admin/content?status=DRAFT'],
			['http://192.168.1.20:5740/admin', '/admin'],
			['http://[::1]:5740/admin', '/admin'],
			['http://mini.tailnet.ts.net:5740/admin', '/admin'],
			['http://syntax.example/admin', '/admin'],
			['https://dev.example/admin?a=1&b=%2F', '/admin?a=1&b=%2F'],
			['http://localhost:5740//evil.example/path', '/'],
			['http://localhost:5740/__syntax_auth/sign-in?return_to=/x', '/'],
			['http://localhost:5740/__syntax_auth', '/']
		])('sends %s to sign in at its own address, returning to %s', (current, return_to) => {
			const response = development.sign_in_redirect_response(new URL(current));
			const location = response.headers.get('Location') ?? '';

			expect(response.status).toBe(302);
			expect(response.headers.get('Cache-Control')).toBe('no-store');
			expect(location).toBe(`/__syntax_auth/sign-in?${new URLSearchParams({ return_to })}`);
			expect(location).not.toContain('37960');
		});

		it.each([
			['own relative path', '/admin/content?status=DRAFT', 'http://localhost:5740/login'],
			['own absolute URL', 'http://localhost:5740/admin/x', 'http://localhost:5740/login'],
			['own network URL', 'http://192.168.1.20:5740/admin', 'http://192.168.1.20:5740/login'],
			[
				'own name',
				'http://mini.tailnet.ts.net:5740/admin',
				'http://mini.tailnet.ts.net:5740/login'
			],
			['configured HTTPS URL', 'https://dev.example/admin', 'http://dev.example/login']
		])('lets /login return to its %s', (_label, requested, app_url) => {
			private_env.SYNTAX_AUTH_PUBLIC_ORIGINS = 'http://other.example, https://dev.example';

			const return_to = development.get_sign_in_return_to(requested, new URL(app_url));
			const { location } = development.get_sign_in_redirect(return_to);

			expect(new URL(location, 'http://base.invalid').searchParams.get('return_to')).toBe(
				new URL(requested, app_url).pathname + new URL(requested, app_url).search
			);
		});

		it.each([
			['foreign', 'https://evil.example/admin', 'http://localhost:5740/login'],
			['protocol-relative', '//evil.example/admin', 'http://localhost:5740/login'],
			['backslash', '/\\evil.example/admin', 'http://localhost:5740/login'],
			['other port', 'http://localhost:3000/admin', 'http://localhost:5740/login'],
			['other loopback name', 'http://127.0.0.1:5740/admin', 'http://localhost:5740/login'],
			['look-alike', 'http://localhost.evil.example:5740/', 'http://localhost:5740/login'],
			['credentialed', 'http://user:pw@localhost:5740/admin', 'http://localhost:5740/login'],
			['unconfigured HTTPS', 'https://dev.example/admin', 'http://dev.example/login'],
			['downgraded', 'http://dev.example/admin', 'https://dev.example/login'],
			['script', 'javascript:alert(1)', 'http://localhost:5740/login'],
			['malformed', 'http://[bad', 'http://localhost:5740/login'],
			['missing', null, 'http://localhost:5740/login']
		])('sends /login home for a %s return_to', (_label, requested, app_url) => {
			const return_to = development.get_sign_in_return_to(requested, new URL(app_url));

			expect(return_to.href).toBe(new URL('/', app_url).href);
			expect(development.get_sign_in_redirect(return_to).location).toBe(
				'/__syntax_auth/sign-in?return_to=%2F'
			);
		});
	});

	describe('session', () => {
		it('skips a signed-out visit where sign-in does not matter', async () => {
			await expect(development.get_syntax_auth(null, event_fetch)).resolves.toEqual({
				auth: null,
				set_cookie_headers: [],
				failure: null
			});
			expect(platform_fetch).not.toHaveBeenCalled();
		});

		it('asks local Syntax Auth for a signed-out visit that requires sign-in', async () => {
			platform_fetch.mockResolvedValue(response_with_cookies(null, []));

			await expect(
				development.get_syntax_auth(null, event_fetch, { required: true })
			).resolves.toEqual({ auth: null, set_cookie_headers: [], failure: null });
			expect(platform_fetch).toHaveBeenCalledWith(
				'http://localhost:37960/api/auth/get-session',
				expect.objectContaining({ headers: { 'Cache-Control': 'no-store' } })
			);
		});

		it('forwards the exact cookie with the platform fetch and keeps refreshed cookies', async () => {
			const cookie_header =
				'__Secure-better-auth.session_token=a%2Eb; theme=dark; __Secure-better-auth.session_token=c';
			const refreshed = [
				'__Secure-better-auth.session_token=new; Path=/; Secure; HttpOnly; SameSite=Lax',
				'__Secure-better-auth.session_data=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax'
			];
			platform_fetch.mockResolvedValue(response_with_cookies(central_response, refreshed));

			const result = await development.get_syntax_auth(cookie_header, event_fetch);

			expect(event_fetch).not.toHaveBeenCalled();
			expect(platform_fetch).toHaveBeenCalledOnce();
			const [url, init] = platform_fetch.mock.calls[0];
			expect(url).toBe('http://localhost:37960/api/auth/get-session');
			expect(init).toMatchObject({
				cache: 'no-store',
				redirect: 'manual',
				headers: { 'Cache-Control': 'no-store', Cookie: cookie_header }
			});
			expect(init?.signal).toBeInstanceOf(AbortSignal);
			expect(result.auth?.user.id).toBe('central-user-id');
			expect(result.auth).not.toHaveProperty('session.token');
			expect(result.set_cookie_headers).toEqual(refreshed);
			expect(result.failure).toBeNull();
		});

		it('reports a refused request', async () => {
			platform_fetch.mockRejectedValue(new TypeError('fetch failed: secret-cookie'));

			const result = await development.get_syntax_auth('session=secret-cookie', event_fetch);

			expect(result).toEqual({
				auth: null,
				set_cookie_headers: [],
				failure: { kind: 'unreachable' }
			});
			expect(logged()).toContain('isn’t answering at http://localhost:37960');
			expect(logged()).not.toContain('secret-cookie');
		});

		it('reports an HTTP failure and keeps its cookies separate', async () => {
			const cookies = ['a=; Path=/; Max-Age=0', 'b=; Path=/; Max-Age=0'];
			platform_fetch.mockResolvedValue(
				response_with_cookies({ message: 'secret-body' }, cookies, 403)
			);

			const result = await development.get_syntax_auth('session=value', event_fetch);

			expect(result).toEqual({
				auth: null,
				set_cookie_headers: cookies,
				failure: { kind: 'status', status: 403 }
			});
			expect(logged()).toContain('HTTP status 403');
			expect(logged()).not.toContain('secret-body');
		});

		it('reports an upstream redirect instead of following it', async () => {
			platform_fetch.mockResolvedValue(
				new Response(null, { status: 302, headers: { Location: 'https://elsewhere.example/' } })
			);

			const result = await development.get_syntax_auth('session=value', event_fetch);

			expect(result.failure).toEqual({ kind: 'status', status: 302 });
		});

		it.each([
			['invalid JSON', new Response('not JSON secret-body')],
			['a malformed session', response_with_cookies({ user: { id: 'secret-body' } }, [])]
		])('reports %s', async (_label, response) => {
			platform_fetch.mockResolvedValue(response);

			const result = await development.get_syntax_auth('session=value', event_fetch);

			expect(result.failure).toEqual({ kind: 'invalid_response' });
			expect(logged()).not.toContain('secret-body');
		});

		it('gives up on a stalled request after five seconds', async () => {
			vi.useFakeTimers();
			platform_fetch.mockImplementation(() => new Promise<Response>(() => undefined));

			const pending = development.get_syntax_auth('session=value', event_fetch);
			await vi.advanceTimersByTimeAsync(4_999);
			let settled = false;
			void pending.then(() => (settled = true));
			await Promise.resolve();
			expect(settled).toBe(false);

			await vi.advanceTimersByTimeAsync(1);
			await expect(pending).resolves.toMatchObject({ failure: { kind: 'timeout' } });
			expect(platform_fetch.mock.calls[0][1]?.signal?.aborted).toBe(true);
		});

		it('gives up on a stalled body within the same five seconds', async () => {
			vi.useFakeTimers();
			platform_fetch.mockResolvedValue(stalled_body_response());

			const pending = development.get_syntax_auth('session=value', event_fetch);
			await vi.advanceTimersByTimeAsync(5_000);

			await expect(pending).resolves.toMatchObject({ failure: { kind: 'timeout' } });
		});
	});

	describe('sign-out origin', () => {
		function origin_check(
			origin: string | null,
			app_url: string,
			sec_fetch_site?: string
		): string | null {
			const request = sign_out_request(origin, null);
			if (sec_fetch_site) request.headers.set('Sec-Fetch-Site', sec_fetch_site);
			return development.get_development_sign_out_origin(request, new URL(app_url));
		}

		it.each([
			['http://localhost:5740', 'http://localhost:5740/logout'],
			['http://127.0.0.1:5740', 'http://127.0.0.1:5740/logout'],
			['http://[::1]:5740', 'http://[::1]:5740/logout'],
			['http://192.168.1.20:5740', 'http://192.168.1.20:5740/logout'],
			['http://100.101.102.103:5740', 'http://100.101.102.103:5740/logout'],
			['http://mini.tailnet.ts.net:5740', 'http://mini.tailnet.ts.net:5740/logout'],
			['https://dev.example', 'https://dev.example/logout']
		])('accepts the request’s own origin %s for %s', (origin, app_url) => {
			expect(origin_check(origin, app_url, 'same-origin')).toBe(origin);
			expect(origin_check(origin, app_url)).toBe(origin);
		});

		it.each([
			['https://dev.example', 'http://dev.example/logout'],
			['https://dev.example:8443', 'http://dev.example:8443/logout'],
			['https://dev.example', 'http://dev.example:443/logout']
		])('accepts the configured HTTPS origin %s in front of %s', (origin, app_url) => {
			private_env.SYNTAX_AUTH_PUBLIC_ORIGINS = 'https://DEV.example/ , https://dev.example:8443';

			expect(origin_check(origin, app_url, 'same-origin')).toBe(origin);
		});

		it.each([
			['missing', null, 'http://localhost:5740/logout'],
			['opaque', 'null', 'http://localhost:5740/logout'],
			['foreign', 'https://evil.example', 'http://localhost:5740/logout'],
			['another port', 'http://localhost:3000', 'http://localhost:5740/logout'],
			['127.0.0.1 for localhost', 'http://127.0.0.1:5740', 'http://localhost:5740/logout'],
			['look-alike', 'https://dev.example.evil.example', 'http://dev.example/logout'],
			['unconfigured HTTPS', 'https://syntax.example', 'http://syntax.example/logout'],
			[
				'HTTPS configured for another port',
				'https://dev.example',
				'http://dev.example:5740/logout'
			],
			['downgraded', 'http://dev.example', 'https://dev.example/logout'],
			['with a path', 'http://localhost:5740/', 'http://localhost:5740/logout'],
			['uppercase', 'http://LOCALHOST:5740', 'http://localhost:5740/logout'],
			['with credentials', 'http://user:pass@localhost:5740', 'http://localhost:5740/logout'],
			['not http', 'file://localhost:5740', 'http://localhost:5740/logout'],
			['unparseable', 'not an origin', 'http://localhost:5740/logout']
		])('rejects a %s Origin', (_label, origin, app_url) => {
			private_env.SYNTAX_AUTH_PUBLIC_ORIGINS = 'https://dev.example';

			expect(origin_check(origin, app_url)).toBeNull();
		});

		it.each(['same-site', 'cross-site', 'none'])(
			'rejects the site’s own Origin marked Sec-Fetch-Site %s',
			(site) => {
				expect(
					origin_check('http://localhost:5740', 'http://localhost:5740/logout', site)
				).toBeNull();
			}
		);

		it.each([
			'https://dev.example/path',
			'ftp://dev.example',
			'not an origin',
			'https://u@dev.example'
		])('ignores the malformed public origin %s', (configured) => {
			private_env.SYNTAX_AUTH_PUBLIC_ORIGINS = configured;

			expect(origin_check('https://dev.example', 'http://dev.example/logout')).toBeNull();
		});
	});

	describe('sign-out', () => {
		it('signs out with the exact cookie and the checked browser origin, then returns home', async () => {
			private_env.SYNTAX_AUTH_PUBLIC_ORIGINS = 'https://syntax.example';
			const cookie_header =
				'__Secure-better-auth.session_token=opaque%2Evalue; better-auth.session_token=plain; theme=dark';
			// Local Syntax Auth ends every session cookie the browser carries, the plain one included.
			const cookies = [
				'__Secure-better-auth.session_token=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax',
				'__Secure-better-auth.session_data=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax',
				'better-auth.session_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
				'better-auth.session_data=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax'
			];
			platform_fetch.mockResolvedValue(response_with_cookies({ success: true }, cookies));
			const request = sign_out_request('https://syntax.example', cookie_header);
			request.headers.set('Sec-Fetch-Site', 'same-origin');
			request.headers.set('X-Syntax-Auth-Dev-Origin', 'https://evil.example');
			request.headers.set('X-Forwarded-Proto', 'https');

			const response = await development.sign_out_syntax_auth(
				request,
				new URL('http://syntax.example/logout'),
				event_fetch
			);

			expect(event_fetch).not.toHaveBeenCalled();
			const [url, init] = platform_fetch.mock.calls[0];
			expect(url).toBe('http://localhost:37960/api/auth/sign-out');
			expect(init).toMatchObject({
				method: 'POST',
				cache: 'no-store',
				redirect: 'manual',
				headers: {
					'Cache-Control': 'no-store',
					Cookie: cookie_header,
					Origin: 'https://syntax.example',
					'x-syntax-auth-dev-origin': 'https://syntax.example'
				}
			});
			expect(Object.keys(init?.headers ?? {})).toHaveLength(4);
			expect(response.status).toBe(303);
			expect(response.headers.get('Location')).toBe('/');
			expect(response.headers.getSetCookie()).toEqual(cookies);
		});

		it('signs out at localhost naming its own origin', async () => {
			platform_fetch.mockResolvedValue(response_with_cookies({ success: true }, []));

			await development.sign_out_syntax_auth(
				sign_out_request('http://localhost:5740', null),
				new URL('http://localhost:5740/logout'),
				event_fetch
			);

			expect(platform_fetch.mock.calls[0][1]?.headers).toEqual({
				'Cache-Control': 'no-store',
				Origin: 'http://localhost:5740',
				'x-syntax-auth-dev-origin': 'http://localhost:5740'
			});
		});

		it.each([
			['missing', null, undefined],
			['foreign', 'https://evil.example', undefined],
			['unconfigured HTTPS', 'https://localhost:5740', undefined],
			['cross-site', 'http://localhost:5740', 'cross-site']
		])('rejects a %s Origin without calling Syntax Auth', async (_label, origin, site) => {
			const request = sign_out_request(origin, 'session=value');
			if (site) request.headers.set('Sec-Fetch-Site', site);

			const response = await development.sign_out_syntax_auth(
				request,
				new URL('http://localhost:5740/logout'),
				event_fetch
			);

			expect(response.status).toBe(403);
			expect(platform_fetch).not.toHaveBeenCalled();
		});

		it('shows a page when local Syntax Auth refuses the request', async () => {
			platform_fetch.mockRejectedValue(new TypeError('fetch failed'));

			const response = await development.sign_out_syntax_auth(
				sign_out_request('http://localhost:5740', 'session=secret-cookie'),
				new URL('http://localhost:5740/logout'),
				event_fetch
			);
			const html = await response.text();

			expect(response.status).toBe(503);
			expect(response.headers.get('Cache-Control')).toBe('no-store');
			expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
			expect(html).toContain('Syntax Auth couldn’t sign you out');
			expect(html).toContain('<code>pnpm dev</code>');
			expect(html).not.toContain('secret-cookie');
		});

		it('answers JSON to scripts and keeps cookies from an HTTP failure', async () => {
			const cookies = ['a=; Path=/; Max-Age=0', 'b=; Path=/; Max-Age=0'];
			platform_fetch.mockResolvedValue(
				response_with_cookies({ code: 'secret-body' }, cookies, 403)
			);

			const response = await development.sign_out_syntax_auth(
				sign_out_request('http://localhost:5740', 'session=value', 'application/json'),
				new URL('http://localhost:5740/logout'),
				event_fetch
			);
			const body = await response.json();

			expect(response.status).toBe(503);
			expect(body).toMatchObject({ error: 'syntax_auth_unavailable' });
			expect(body.message).toContain('HTTP status 403');
			expect(JSON.stringify(body)).not.toContain('secret-body');
			expect(response.headers.getSetCookie()).toEqual(cookies);
		});

		it('gives up on a stalled sign-out after five seconds', async () => {
			vi.useFakeTimers();
			platform_fetch.mockImplementation(() => new Promise<Response>(() => undefined));

			const pending = development.sign_out_syntax_auth(
				sign_out_request('http://localhost:5740', 'session=value', 'application/json'),
				new URL('http://localhost:5740/logout'),
				event_fetch
			);
			await vi.advanceTimersByTimeAsync(5_000);
			const response = await pending;

			expect(response.status).toBe(503);
			expect((await response.json()).message).toContain('within 5 seconds');
		});
	});
});
