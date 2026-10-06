import { error, isHttpError, type Handle, type RequestEvent } from '@sveltejs/kit';
import { createRequire } from 'node:module';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { find_profile } = vi.hoisted(() => ({ find_profile: vi.fn() }));

vi.mock('@sentry/sveltekit', () => ({
	init: vi.fn(),
	redisIntegration: vi.fn(),
	sentryHandle:
		(): Handle =>
		async ({ event, resolve }) =>
			resolve(event),
	handleErrorWithSentry: () => vi.fn()
}));
vi.mock('@sentry/profiling-node', () => ({ nodeProfilingIntegration: vi.fn() }));
vi.mock('sk-form-data', () => ({
	form_data: (({ event, resolve }) => resolve(event)) satisfies Handle
}));
// SvelteKit's sequence needs its request store; this one runs the same handles in order.
vi.mock('@sveltejs/kit/hooks', () => ({
	sequence:
		(...handles: Handle[]): Handle =>
		({ event, resolve }) => {
			const run = (index: number, current: RequestEvent): ReturnType<Handle> =>
				index === handles.length
					? resolve(current)
					: handles[index]({ event: current, resolve: (next) => run(index + 1, next) });
			return run(0, event);
		}
}));
vi.mock('$server/db/client', () => ({
	db: { query: { profile: { findFirst: find_profile } } }
}));

async function load_handle(dev: boolean): Promise<Handle> {
	vi.resetModules();
	vi.doMock('$app/environment', () => ({ dev }));
	return (await import('./hooks.server')).handle;
}

const central_session = {
	user: {
		id: 'local-developer',
		name: 'Local Developer',
		email: 'dev@localhost',
		emailVerified: true,
		image: null,
		createdAt: '2026-10-05T00:00:00.000Z',
		updatedAt: '2026-10-05T00:00:00.000Z'
	},
	session: {
		id: 'session-id',
		userId: 'local-developer',
		expiresAt: '2026-11-05T00:00:00.000Z',
		createdAt: '2026-10-05T00:00:00.000Z',
		updatedAt: '2026-10-05T00:00:00.000Z',
		token: 'secret-token'
	}
};

function session_response(body: unknown, cookies: string[] = [], status = 200): Response {
	const headers = new Headers({ 'Content-Type': 'application/json' });
	for (const cookie of cookies) headers.append('Set-Cookie', cookie);
	return new Response(JSON.stringify(body), { status, headers });
}

const event_fetch = vi.fn<typeof fetch>();
const platform_fetch = vi.fn<typeof fetch>();

function make_event(
	href: string,
	{
		route_id,
		cookie,
		accept = 'text/html'
	}: { route_id: string | null; cookie?: string; accept?: string }
): RequestEvent {
	const url = new URL(href);
	const headers = new Headers({ Accept: accept });
	if (cookie) headers.set('Cookie', cookie);
	return {
		url,
		route: { id: route_id },
		request: new Request(url, { headers }),
		cookies: { get: () => undefined },
		locals: {},
		fetch: event_fetch
	} as unknown as RequestEvent;
}

const resolve = vi.fn(async () => new Response('page'));

beforeEach(() => {
	event_fetch.mockReset();
	platform_fetch.mockReset();
	resolve.mockClear();
	find_profile.mockReset();
	find_profile.mockResolvedValue({ id: 'profile-id', roles: [{ role: { name: 'admin' } }] });
	vi.stubGlobal('fetch', platform_fetch);
	vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('auth hook in production', async () => {
	const handle = await load_handle(false);

	it('sends a signed-out admin visit to central sign-in without asking Auth', async () => {
		const response = await handle({
			event: make_event('https://syntax.fm/admin/content', { route_id: '/(site)/admin/content' }),
			resolve
		});
		const location = new URL(response.headers.get('Location') ?? '');

		expect(response.status).toBe(302);
		expect(location.origin).toBe('https://auth.syntax.fm');
		expect(location.searchParams.get('return_to')).toBe('https://syntax.fm/admin/content');
		expect(event_fetch).not.toHaveBeenCalled();
		expect(platform_fetch).not.toHaveBeenCalled();
	});

	it('reads the session with event.fetch and forwards every refreshed cookie', async () => {
		const cookies = ['a=1; Path=/; Secure; HttpOnly', 'b=2; Path=/; Secure; HttpOnly'];
		event_fetch.mockResolvedValue(session_response(central_session, cookies));
		const event = make_event('https://syntax.fm/admin', {
			route_id: '/(site)/admin',
			cookie: '__Secure-better-auth.session_token=opaque'
		});

		const response = await handle({ event, resolve });

		expect(event_fetch).toHaveBeenCalledOnce();
		expect(platform_fetch).not.toHaveBeenCalled();
		expect(resolve).toHaveBeenCalledOnce();
		expect(event.locals.user?.roles).toEqual(['admin']);
		expect(response.headers.getSetCookie()).toEqual(cookies);
	});

	it('treats an Auth failure as signed out', async () => {
		event_fetch.mockRejectedValue(new TypeError('fetch failed'));

		const response = await handle({
			event: make_event('https://syntax.fm/admin', {
				route_id: '/(site)/admin',
				cookie: 'session=value'
			}),
			resolve
		});

		expect(response.status).toBe(302);
		expect(new URL(response.headers.get('Location') ?? '').origin).toBe('https://auth.syntax.fm');
	});
});

describe('auth hook in development', async () => {
	const handle = await load_handle(true);

	it('renders a public page without asking Auth when there is no cookie', async () => {
		const response = await handle({
			event: make_event('http://192.168.1.20:5740/', { route_id: '/(site)' }),
			resolve
		});

		expect(await response.text()).toBe('page');
		expect(platform_fetch).not.toHaveBeenCalled();
	});

	it('renders a public page signed out when Auth is down', async () => {
		platform_fetch.mockRejectedValue(new TypeError('fetch failed'));
		const event = make_event('http://localhost:5740/', {
			route_id: '/(site)',
			cookie: 'theme=dark'
		});

		const response = await handle({ event, resolve });

		expect(await response.text()).toBe('page');
		expect(event.locals.user).toBeNull();
	});

	it.each([
		['an admin page', 'http://localhost:5740/admin', '/(site)/admin'],
		['the login page', 'http://localhost:5740/login', '/(site)/login']
	])(
		'shows the restart fix for a signed-out visit to %s when Auth is down',
		async (_l, href, id) => {
			platform_fetch.mockRejectedValue(new TypeError('fetch failed'));

			const response = await handle({ event: make_event(href, { route_id: id }), resolve });

			expect(response.status).toBe(503);
			expect(response.headers.get('Cache-Control')).toBe('no-store');
			expect(await response.text()).toContain('<code>pnpm dev</code>');
			expect(resolve).not.toHaveBeenCalled();
		}
	);

	it('answers JSON to a data request when Auth is down', async () => {
		platform_fetch.mockResolvedValue(session_response({}, [], 500));

		const response = await handle({
			event: make_event('http://localhost:5740/admin', {
				route_id: '/(site)/admin',
				accept: '*/*'
			}),
			resolve
		});

		expect(response.status).toBe(503);
		await expect(response.json()).resolves.toMatchObject({ error: 'syntax_auth_unavailable' });
	});

	it.each([
		['http://localhost:5740/admin/content?status=DRAFT', '/admin/content?status=DRAFT'],
		['http://mini.tailnet.ts.net:5740/admin', '/admin'],
		['http://syntax.example/admin', '/admin']
	])('sends a signed-out visit to %s to sign in at the same address', async (href, return_to) => {
		const cleared = ['session=; Path=/; Max-Age=0', 'data=; Path=/; Max-Age=0'];
		platform_fetch.mockResolvedValue(session_response(null, cleared));

		const response = await handle({
			event: make_event(href, { route_id: '/(site)/admin', cookie: 'session=expired' }),
			resolve
		});
		const location = response.headers.get('Location') ?? '';

		expect(response.status).toBe(302);
		expect(location).toBe(`/__syntax_auth/sign-in?${new URLSearchParams({ return_to })}`);
		expect(response.headers.getSetCookie()).toEqual(cleared);
		expect(platform_fetch.mock.calls[0][1]?.headers).toEqual({
			'Cache-Control': 'no-store',
			Cookie: 'session=expired'
		});
		expect(event_fetch).not.toHaveBeenCalled();
	});

	it('lets a mapped admin in and forwards every refreshed cookie', async () => {
		const cookies = ['a=1; Path=/; HttpOnly', 'b=2; Path=/; HttpOnly'];
		platform_fetch.mockResolvedValue(session_response(central_session, cookies));
		const event = make_event('https://syntax.example/admin', {
			route_id: '/(site)/admin',
			cookie: 'session=value'
		});

		const response = await handle({ event, resolve });

		expect(await response.text()).toBe('page');
		expect(event.locals.user?.id).toBe('local-developer');
		expect(event.locals.auth_session).not.toHaveProperty('token');
		expect(response.headers.getSetCookie()).toEqual(cookies);
	});

	it('still blocks a signed-in user without the admin role', async () => {
		find_profile.mockResolvedValue(undefined);
		platform_fetch.mockResolvedValue(session_response(central_session));

		const response = await handle({
			event: make_event('http://localhost:5740/admin', {
				route_id: '/(site)/admin',
				cookie: 'session=value'
			}),
			resolve
		});

		expect(response.status).toBe(403);
	});

	it('leaves sign-out to the logout route', async () => {
		await handle({
			event: make_event('http://localhost:5740/logout', {
				route_id: '/logout',
				cookie: 'session=value'
			}),
			resolve
		});

		expect(platform_fetch).not.toHaveBeenCalled();
	});
});

// SvelteKit rewrites some hook responses after the hook returns, so these run the hook inside the
// installed SvelteKit server itself (not exported, so loaded from its source) and check what the
// browser actually receives.
type Callable = (...args: unknown[]) => unknown;

function is_callable(value: unknown): value is Callable {
	return typeof value === 'function';
}

const kit_root = path.dirname(createRequire(import.meta.url).resolve('@sveltejs/kit/package.json'));

async function load_installed_kit(file: string, name: string): Promise<Callable> {
	const module: unknown = await import(/* @vite-ignore */ path.join(kit_root, file));
	const value: unknown =
		typeof module === 'object' && module !== null ? Reflect.get(module, name) : undefined;
	if (!is_callable(value)) throw new Error(`The installed SvelteKit ${file} has no ${name}`);
	return value;
}

// Remote function modules by hash, as SvelteKit's manifest loads them.
type Remotes = Record<string, () => Promise<{ default: Record<string, unknown> }>>;

async function respond_with_installed_kit(
	handle: Handle,
	request: Request,
	remotes: Remotes = {}
): Promise<Response> {
	const respond = await load_installed_kit('src/runtime/server/respond.js', 'respond');
	const parse_route_id = await load_installed_kit('src/utils/routing.js', 'parse_route_id');
	const routes = ['/(site)/admin', '/(site)/admin/content'].map((id) => {
		const parsed = parse_route_id(id);
		if (typeof parsed !== 'object' || parsed === null) throw new Error(`Unparsed route ${id}`);
		return { id, ...parsed, page: undefined, endpoint: undefined };
	});
	const options = {
		hooks: {
			handle,
			reroute: () => undefined,
			handleError: () => ({ message: 'Internal Error' }),
			// SvelteKit's default, which event.fetch always calls.
			handleFetch: ({ request, fetch }: { request: Request; fetch: typeof globalThis.fetch }) =>
				fetch(request),
			transport: {}
		},
		csrf_check_origin: true,
		csrf_trusted_origins: [],
		hash_routing: false
	};
	const manifest = { _: { matchers: async () => ({}), routes, remotes } };

	const response: unknown = await respond(request, options, manifest, { depth: 0 });
	if (!(response instanceof Response)) throw new Error('SvelteKit answered without a Response');
	return response;
}

// The browser's client-side navigation fetches page data with fetch's default Accept.
function data_request(href: string, cookie?: string): Request {
	const headers = new Headers({ Accept: '*/*' });
	if (cookie) headers.set('Cookie', cookie);
	return new Request(href, { headers });
}

describe('auth hook through the installed SvelteKit server', () => {
	// The plain and the HTTPS-only session cookie, each cleared with its own header.
	const cleared = [
		'better-auth.session_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
		'__Secure-better-auth.session_token=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax'
	];
	const sign_in = `/__syntax_auth/sign-in?${new URLSearchParams({ return_to: '/admin' })}`;
	const both_cookies = 'better-auth.session_token=old; __Secure-better-auth.session_token=old';

	it('keeps both cookie clears on a signed-out admin data request in development', async () => {
		const handle = await load_handle(true);
		platform_fetch.mockResolvedValue(session_response(null, cleared));

		const response = await respond_with_installed_kit(
			handle,
			data_request(
				'http://localhost:5740/admin/__data.json?x-sveltekit-invalidated=11',
				both_cookies
			)
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ type: 'redirect', location: sign_in });
		expect(response.headers.getSetCookie()).toEqual(cleared);
	});

	it('answers that data request exactly as SvelteKit answers a redirect, plus the cookies', async () => {
		const handle = await load_handle(true);
		platform_fetch.mockResolvedValue(session_response(null, cleared));
		const href = 'http://localhost:5740/admin/__data.json?x-sveltekit-invalidated=11';
		const plain_redirect: Handle = async () =>
			new Response(null, { status: 302, headers: { Location: sign_in } });

		const ours = await respond_with_installed_kit(handle, data_request(href, both_cookies));
		const sveltekit = await respond_with_installed_kit(plain_redirect, data_request(href));

		expect(sveltekit.headers.getSetCookie()).toEqual([]);
		const without_cookies = new Headers(ours.headers);
		without_cookies.delete('Set-Cookie');
		expect([...without_cookies]).toEqual([...sveltekit.headers]);
		expect(ours.status).toBe(sveltekit.status);
		expect(await ours.text()).toBe(await sveltekit.text());
	});

	it('keeps both cookie clears on a signed-out admin page request in development', async () => {
		const handle = await load_handle(true);
		platform_fetch.mockResolvedValue(session_response(null, cleared));
		const request = new Request('http://localhost:5740/admin', {
			headers: { Accept: 'text/html', Cookie: both_cookies }
		});

		const response = await respond_with_installed_kit(handle, request);

		expect(response.status).toBe(302);
		expect(response.headers.get('Location')).toBe(sign_in);
		expect(response.headers.getSetCookie()).toEqual(cleared);
	});

	it('leaves a production admin data request to SvelteKit’s own redirect', async () => {
		const handle = await load_handle(false);

		const response = await respond_with_installed_kit(
			handle,
			data_request('https://syntax.fm/admin/__data.json?x-sveltekit-invalidated=11')
		);

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('application/json');
		expect(await response.json()).toEqual({
			type: 'redirect',
			location: `https://auth.syntax.fm/sign-in?${new URLSearchParams({ return_to: 'https://syntax.fm/admin' })}`
		});
		expect(platform_fetch).not.toHaveBeenCalled();
	});

	it('shows the restart command on a client-side navigation when Auth is down', async () => {
		const handle = await load_handle(true);
		platform_fetch.mockRejectedValue(new TypeError('fetch failed: secret-cookie'));

		const response = await respond_with_installed_kit(
			handle,
			data_request(
				'http://localhost:5740/admin/__data.json?x-sveltekit-invalidated=11',
				'session=secret-cookie'
			)
		);

		// What the client router does with a failed data response (load_data in client.js): a JSON
		// body becomes the HttpError, and src/routes/+error.svelte shows only its message.
		expect(response.status).toBe(503);
		expect(response.headers.get('Content-Type')).toContain('application/json');
		const body: unknown = await response.json();
		if (typeof body !== 'object' || body === null || !('message' in body)) {
			throw new Error('Expected a JSON error with a message');
		}
		const message = String(body.message);
		let thrown: unknown;
		try {
			error(response.status, { message });
		} catch (http_error) {
			thrown = http_error;
		}

		expect(isHttpError(thrown, 503) && thrown.body.message).toBe(
			'Syntax Auth couldn’t check your sign-in. Local Syntax Auth isn’t answering at ' +
				'http://localhost:37960. Make sure Docker Desktop (or OrbStack) is running, then stop ' +
				'this dev server and start it again with pnpm dev. Starting it starts local Syntax Auth ' +
				'and prints any problem that remains.'
		);
		expect(JSON.stringify(body)).not.toContain('secret-cookie');
		expect(JSON.stringify(body)).not.toContain('fetch failed');
	});
});

// A client-side navigation to an admin page that has no server load fetches no page data; the page's
// remote query is the first request the hook sees, with the page's path in its headers. These run
// the installed client query wrapper and remote_request (with SvelteKit's own devalue parser)
// against the hook inside the installed SvelteKit server. Only the router's goto, the page state,
// and the query cache are stand-ins.
type QueryFetcher = (payload: string) => Promise<unknown>;

function is_query_fetcher(value: unknown): value is QueryFetcher {
	return typeof value === 'function';
}

async function load_installed_query(
	page: URL,
	goto: (location: string) => Promise<void>
): Promise<QueryFetcher> {
	const client = path.join(kit_root, 'src/runtime/client');
	vi.doMock(path.join(client, 'client.js'), () => ({
		app: { decoders: {}, hooks: { transport: {} } },
		goto,
		query_map: new Map(),
		live_query_map: new Map(),
		query_responses: {}
	}));
	vi.doMock(path.join(client, 'state.svelte.js'), () => ({
		navigating: { current: null },
		page: { url: page }
	}));
	let fetcher: unknown;
	vi.doMock(path.join(client, 'remote-functions/query/proxy.js'), () => ({
		QueryProxy: class {
			constructor(_id: string, _arg: unknown, fn: unknown) {
				fetcher = fn;
			}
		}
	}));
	vi.doMock('$app/paths/internal/client', () => ({ base: '', app_dir: '_app' }));

	const query = await load_installed_kit(
		'src/runtime/client/remote-functions/query/index.js',
		'query'
	);
	const get_dashboard = query('dashboard_hash/get_dashboard');
	if (!is_callable(get_dashboard)) throw new Error('The installed query made no remote function');
	get_dashboard();
	if (!is_query_fetcher(fetcher)) throw new Error('The installed query passed no fetcher');
	return fetcher;
}

const AUTH_ORIGIN = 'http://localhost:37960/';

interface BrowserRun {
	outcome: PromiseSettledResult<unknown>;
	goto_calls: string[];
	remote_responses: Response[];
	auth_calls: number;
}

/** A page at `page_href` runs its remote query once, as the browser would, cookie and all. */
async function run_remote_query(
	handle: Handle,
	page_href: string,
	auth: () => Promise<Response>,
	cookie?: string
): Promise<BrowserRun> {
	const page = new URL(page_href);
	const run: BrowserRun = {
		outcome: { status: 'fulfilled', value: undefined },
		goto_calls: [],
		remote_responses: [],
		auth_calls: 0
	};

	platform_fetch.mockImplementation(async (input, init) => {
		const href = input instanceof Request ? input.url : String(input);
		if (href.startsWith(AUTH_ORIGIN)) {
			run.auth_calls += 1;
			return auth();
		}
		// The browser's fetch: same origin, its default Accept, and the page's cookies.
		const headers = new Headers(init?.headers);
		headers.set('Accept', '*/*');
		if (cookie) headers.set('Cookie', cookie);
		const response = await respond_with_installed_kit(
			handle,
			new Request(new URL(href, page), { method: init?.method ?? 'GET', headers })
		);
		run.remote_responses.push(response.clone());
		return response;
	});

	// goto's own check (client.js): it refuses any URL outside the page's origin.
	const goto = async (location: string) => {
		run.goto_calls.push(location);
		if (new URL(location, page).origin !== page.origin) throw new Error('goto: external URL');
	};

	const fetcher = await load_installed_query(page, goto);
	[run.outcome] = await Promise.allSettled([fetcher('')]);
	return run;
}

function document_request(href: string, cookie?: string): Request {
	const headers = new Headers({ Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' });
	if (cookie) headers.set('Cookie', cookie);
	return new Request(href, { headers });
}

describe('admin remote queries through the installed SvelteKit client and server', () => {
	const cleared = [
		'better-auth.session_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
		'__Secure-better-auth.session_token=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax'
	];
	const diagnostic = (reason: string) =>
		`/__syntax_auth_unavailable?${reason}&return_to=%2Fadmin%3Ftab%3Dstats`;

	it('sends a signed-out visitor to sign in with one document navigation', async () => {
		const handle = await load_handle(true);

		const run = await run_remote_query(handle, 'http://localhost:5740/admin', async () =>
			session_response(null, cleared)
		);

		expect(run.outcome).toEqual({ status: 'fulfilled', value: undefined });
		expect(run.goto_calls).toEqual([
			`/__syntax_auth/sign-in?${new URLSearchParams({ return_to: '/admin' })}`
		]);
		expect(run.remote_responses).toHaveLength(1);
		expect(run.auth_calls).toBe(1);
		const [response] = run.remote_responses;
		expect(response.status).toBe(200);
		expect(response.headers.get('Cache-Control')).toBe('private, no-store');
		expect(response.headers.getSetCookie()).toEqual(cleared);
	});

	it.each<[string, () => Promise<Response>, string, string[]]>([
		[
			'isn’t answering',
			async () => {
				throw new TypeError('fetch failed: secret-cookie');
			},
			'reason=unreachable',
			[]
		],
		[
			'answers an error',
			async () => session_response({ message: 'stack: secret-cookie' }, cleared, 503),
			'reason=status&status=503',
			cleared
		],
		[
			'answers something unreadable',
			async () => new Response('<html>secret-cookie</html>', { status: 200 }),
			'reason=invalid_response',
			[]
		]
	])('shows the restart fix page once when Auth %s', async (_label, auth, reason, cookies) => {
		const handle = await load_handle(true);

		const run = await run_remote_query(
			handle,
			'http://localhost:5740/admin?tab=stats',
			auth,
			'better-auth.session_token=secret-cookie'
		);

		expect(run.outcome).toEqual({ status: 'fulfilled', value: undefined });
		expect(run.goto_calls).toEqual([diagnostic(reason)]);
		expect(run.remote_responses).toHaveLength(1);
		expect(run.auth_calls).toBe(1);
		const [response] = run.remote_responses;
		expect(response.status).toBe(200);
		expect(response.headers.getSetCookie()).toEqual(cookies);
		const body = await response.text();
		expect(body).not.toContain('secret-cookie');
		expect(body).not.toContain('stack');

		// goto finds no client route there in development (src/params/app_path.ts), so the
		// browser loads it as a document, which the hook renders without asking Auth.
		const page = await respond_with_installed_kit(
			handle,
			document_request(
				`http://localhost:5740${run.goto_calls[0]}`,
				'better-auth.session_token=secret-cookie'
			)
		);
		const html = await page.text();

		expect(run.auth_calls).toBe(1);
		expect(page.status).toBe(503);
		expect(page.headers.get('Cache-Control')).toBe('no-store');
		expect(page.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
		expect(html).toContain('<h1>Syntax Auth couldn’t check your sign-in</h1>');
		expect(html).toContain('<code>pnpm dev</code>');
		expect(html).toContain('<a href="/admin?tab=stats">');
		expect(html).not.toContain('secret-cookie');
		const logged = vi.mocked(console.error).mock.calls.flat().map(String).join('\n');
		expect(logged).not.toContain('secret-cookie');
		expect(logged).not.toContain('stack');
	});

	it('leaves a production remote query to the existing redirect', async () => {
		const handle = await load_handle(false);

		const response = await respond_with_installed_kit(
			handle,
			new Request('https://syntax.fm/_app/remote/dashboard_hash/get_dashboard', {
				headers: { Accept: '*/*', 'x-sveltekit-pathname': '/admin', 'x-sveltekit-search': '' }
			})
		);

		expect(response.status).toBe(302);
		expect(response.headers.get('Location')).toBe(
			`https://auth.syntax.fm/sign-in?${new URLSearchParams({ return_to: 'https://syntax.fm/admin' })}`
		);
		expect(platform_fetch).not.toHaveBeenCalled();
	});
});

// An admin page's command, sent by the installed client command wrapper to the hook inside the
// installed SvelteKit server, which runs the command itself if the hook lets the call through. Only
// the router's goto and the page state are stand-ins.
type CommandFetcher = (arg: unknown) => Promise<unknown>;

function is_command_fetcher(value: unknown): value is CommandFetcher {
	return typeof value === 'function';
}

async function load_installed_command(
	page: URL,
	goto: (location: string) => Promise<void>
): Promise<CommandFetcher> {
	const client = path.join(kit_root, 'src/runtime/client');
	vi.doMock(path.join(client, 'client.js'), () => ({
		app: { decoders: {}, hooks: { transport: {} } },
		goto,
		query_map: new Map(),
		live_query_map: new Map(),
		query_responses: {}
	}));
	vi.doMock(path.join(client, 'state.svelte.js'), () => ({
		navigating: { current: null },
		page: { url: page }
	}));
	vi.doMock('$app/paths/internal/client', () => ({ base: '', app_dir: '_app' }));

	const command = await load_installed_kit(
		'src/runtime/client/remote-functions/command.svelte.js',
		'command'
	);
	const save_content = command('admin_hash/save_content');
	if (!is_command_fetcher(save_content)) throw new Error('The installed command made no function');
	return save_content;
}

interface CommandRun extends BrowserRun {
	executions: unknown[];
}

/** A page at `page_href` calls its command once, as the browser would, cookie and all. */
async function run_remote_command(
	handle: Handle,
	page_href: string,
	auth: (signal: AbortSignal | null | undefined) => Promise<Response>,
	{
		cookie,
		while_pending
	}: { cookie?: string; while_pending?: (run: CommandRun) => Promise<void> } = {}
): Promise<CommandRun> {
	const page = new URL(page_href);
	const run: CommandRun = {
		outcome: { status: 'fulfilled', value: undefined },
		goto_calls: [],
		remote_responses: [],
		auth_calls: 0,
		executions: []
	};
	// What SvelteKit runs if the hook lets the command through.
	const save_content = Object.assign(
		async (arg: unknown) => {
			run.executions.push(arg);
			return 'saved';
		},
		{ __: { type: 'command', name: 'save_content', id: 'admin_hash/save_content' } }
	);
	const remotes: Remotes = { admin_hash: async () => ({ default: { save_content } }) };

	platform_fetch.mockImplementation(async (input, init) => {
		const href = input instanceof Request ? input.url : String(input);
		if (href.startsWith(AUTH_ORIGIN)) {
			run.auth_calls += 1;
			return auth(init?.signal);
		}
		const headers = new Headers(init?.headers);
		headers.set('Accept', '*/*');
		headers.set('Origin', page.origin);
		if (cookie) headers.set('Cookie', cookie);
		const response = await respond_with_installed_kit(
			handle,
			new Request(new URL(href, page), { method: init?.method, headers, body: init?.body }),
			remotes
		);
		run.remote_responses.push(response.clone());
		return response;
	});

	const goto = async (location: string) => {
		run.goto_calls.push(location);
	};

	const fetcher = await load_installed_command(page, goto);
	// Auth's deadline timer is started by the call, so a test that waits it out fakes it from here.
	if (while_pending) vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	const pending = Promise.allSettled([fetcher({ title: 'Draft' })]);
	await while_pending?.(run);
	[run.outcome] = await pending;
	return run;
}

/** The HttpError the installed client threw, as status and body. */
function rejected_http_error(outcome: PromiseSettledResult<unknown>): {
	status: number;
	body: unknown;
} {
	if (outcome.status !== 'rejected') throw new Error('Expected the command to fail');
	const reason: unknown = outcome.reason;
	if (!isHttpError(reason)) throw new Error(`Expected an HttpError, got ${String(reason)}`);
	return { status: reason.status, body: reason.body };
}

describe('admin remote commands through the installed SvelteKit client and server', () => {
	const cleared = [
		'better-auth.session_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
		'__Secure-better-auth.session_token=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax'
	];
	const fix =
		'Make sure Docker Desktop (or OrbStack) is running, then stop this dev server and start it ' +
		'again with pnpm dev. Starting it starts local Syntax Auth and prints any problem that remains.';
	const secret = 'better-auth.session_token=secret-cookie';

	function expect_one_unrun_call(run: CommandRun) {
		expect(run.goto_calls).toEqual([]);
		expect(run.remote_responses).toHaveLength(1);
		expect(run.executions).toEqual([]);
		const [response] = run.remote_responses;
		expect(response.status).toBe(200);
		expect(response.headers.get('Cache-Control')).toBe('private, no-store');
		return response;
	}

	it('runs the command for a signed-in admin, so the harness reaches it', async () => {
		const handle = await load_handle(true);

		const run = await run_remote_command(
			handle,
			'http://localhost:5740/admin/content',
			async () => session_response(central_session),
			{ cookie: secret }
		);

		expect(run.outcome).toEqual({ status: 'fulfilled', value: 'saved' });
		expect(run.executions).toEqual([{ title: 'Draft' }]);
	});

	it.each<
		[string, (signal: AbortSignal | null | undefined) => Promise<Response>, string, string[]]
	>([
		[
			'isn’t answering',
			async () => {
				throw new TypeError('fetch failed: secret-cookie');
			},
			'Local Syntax Auth isn’t answering at http://localhost:37960.',
			[]
		],
		[
			'answers an error',
			async () => session_response({ message: 'stack: secret-cookie' }, cleared, 503),
			'Local Syntax Auth answered with HTTP status 503.',
			cleared
		]
	])('fails with the restart fix, unrun, when Auth %s', async (_label, auth, problem, cookies) => {
		const handle = await load_handle(true);

		const run = await run_remote_command(handle, 'http://localhost:5740/admin', auth, {
			cookie: secret
		});

		expect(rejected_http_error(run.outcome)).toEqual({
			status: 503,
			body: { message: `Syntax Auth couldn’t check your sign-in. ${problem} ${fix}` }
		});
		const response = expect_one_unrun_call(run);
		expect(run.auth_calls).toBe(1);
		expect(response.headers.getSetCookie()).toEqual(cookies);
		const body = await response.text();
		expect(body).not.toContain('secret-cookie');
		expect(body).not.toContain('stack');
	});

	it('fails with the restart fix, unrun, when Auth’s body stalls past the deadline', async () => {
		const handle = await load_handle(true);
		let auth_signal: AbortSignal | null | undefined;

		const run = await run_remote_command(
			handle,
			'http://localhost:5740/admin',
			async (signal) => {
				auth_signal = signal;
				const headers = new Headers({ 'Content-Type': 'application/json' });
				for (const cookie of cleared) headers.append('Set-Cookie', cookie);
				// Headers arrive, the body never does.
				return new Response(new ReadableStream(), { status: 200, headers });
			},
			{
				cookie: secret,
				while_pending: async (pending_run) => {
					await vi.waitFor(() => expect(pending_run.auth_calls).toBe(1));
					await vi.advanceTimersByTimeAsync(5_000);
				}
			}
		);

		expect(rejected_http_error(run.outcome)).toEqual({
			status: 503,
			body: {
				message: `Syntax Auth couldn’t check your sign-in. Local Syntax Auth didn’t answer within 5 seconds. ${fix}`
			}
		});
		const response = expect_one_unrun_call(run);
		expect(response.headers.getSetCookie()).toEqual(cleared);
		expect(run.auth_calls).toBe(1);
		expect(auth_signal?.aborted).toBe(true);
	});

	it('asks a signed-out visitor to sign in, unrun, without a redirect', async () => {
		const handle = await load_handle(true);

		const run = await run_remote_command(
			handle,
			'http://localhost:5740/admin/content?tab=drafts',
			async () => session_response(null, cleared),
			{ cookie: secret }
		);

		expect(rejected_http_error(run.outcome)).toEqual({
			status: 401,
			body: {
				message:
					'Sign in needed: your Syntax sign-in has ended. Sign in, then try again. Nothing was changed.',
				sign_in: `/__syntax_auth/sign-in?${new URLSearchParams({ return_to: '/admin/content?tab=drafts' })}`
			}
		});
		const response = expect_one_unrun_call(run);
		expect(response.headers.get('Location')).toBeNull();
		expect(response.headers.getSetCookie()).toEqual(cleared);
	});

	it('refuses a signed-in user without the admin role with a 403, unrun', async () => {
		const handle = await load_handle(true);
		find_profile.mockResolvedValue(undefined);

		const run = await run_remote_command(
			handle,
			'http://localhost:5740/admin',
			async () => session_response(central_session),
			{ cookie: secret }
		);

		expect(rejected_http_error(run.outcome)).toEqual({
			status: 403,
			body: {
				message:
					'Admin access required: your Syntax account doesn’t have the admin role. Nothing was changed.'
			}
		});
		expect_one_unrun_call(run);
	});

	it('refuses a remote query from a user without the admin role with a 403', async () => {
		const handle = await load_handle(true);
		find_profile.mockResolvedValue(undefined);

		const run = await run_remote_query(
			handle,
			'http://localhost:5740/admin',
			async () => session_response(central_session),
			secret
		);

		expect(rejected_http_error(run.outcome)).toMatchObject({ status: 403 });
		expect(run.goto_calls).toEqual([]);
		expect(run.remote_responses).toHaveLength(1);
	});

	const production_sign_in = `https://auth.syntax.fm/sign-in?${new URLSearchParams({ return_to: 'https://syntax.fm/admin' })}`;

	it.each<[string, () => Promise<Response>, () => Response]>([
		[
			'a signed-out',
			async () => session_response(null),
			() => new Response(null, { status: 302, headers: { Location: production_sign_in } })
		],
		[
			'a non-admin',
			async () => session_response(central_session),
			() => new Response('Admin access required', { status: 403 })
		]
	])(
		'answers %s production command with the raw guard response, exactly',
		async (_label, auth, raw_guard_response) => {
			find_profile.mockResolvedValue(undefined);
			const executions: unknown[] = [];
			const save_content = Object.assign(async () => executions.push('ran'), {
				__: { type: 'command', name: 'save_content' }
			});
			const remotes: Remotes = { admin_hash: async () => ({ default: { save_content } }) };
			const command_request = () =>
				new Request('https://syntax.fm/_app/remote/admin_hash/save_content', {
					method: 'POST',
					headers: {
						Accept: '*/*',
						'Content-Type': 'application/json',
						Origin: 'https://syntax.fm',
						Cookie: '__Secure-better-auth.session_token=opaque',
						'x-sveltekit-pathname': '/admin',
						'x-sveltekit-search': ''
					},
					body: JSON.stringify({ payload: '', refreshes: [] })
				});
			// SvelteKit's own event.fetch sends the session request through the platform fetch.
			platform_fetch.mockImplementation(auth);

			const ours = await respond_with_installed_kit(
				await load_handle(false),
				command_request(),
				remotes
			);
			const raw = await respond_with_installed_kit(
				async () => raw_guard_response(),
				command_request(),
				remotes
			);

			expect(ours.status).toBe(raw.status);
			expect([...ours.headers]).toEqual([...raw.headers]);
			expect(await ours.text()).toBe(await raw.text());
			expect(executions).toEqual([]);
			expect(platform_fetch).toHaveBeenCalledOnce();
		}
	);
});

describe('the development Syntax Auth diagnostic page', () => {
	const href = 'http://localhost:5740/__syntax_auth_unavailable?reason=timeout&return_to=%2Fadmin';

	it('is rendered by the hook without asking Auth, even with a cookie', async () => {
		const handle = await load_handle(true);

		const response = await handle({
			event: make_event(href, { route_id: null, cookie: 'session=secret-cookie' }),
			resolve
		});

		expect(response.status).toBe(503);
		expect(await response.text()).toContain('Local Syntax Auth didn’t answer within 5 seconds.');
		expect(platform_fetch).not.toHaveBeenCalled();
		expect(resolve).not.toHaveBeenCalled();
	});

	it('refuses an unsafe link without asking Auth', async () => {
		const handle = await load_handle(true);

		const response = await handle({
			event: make_event(
				'http://localhost:5740/__syntax_auth_unavailable?reason=timeout&return_to=%2F%2Fevil.example',
				{ route_id: null, cookie: 'session=secret-cookie' }
			),
			resolve
		});

		expect(response.status).toBe(400);
		expect(platform_fetch).not.toHaveBeenCalled();
		expect(resolve).not.toHaveBeenCalled();
	});

	it('gives a POST there no way past the admin check', async () => {
		const handle = await load_handle(true);
		platform_fetch.mockResolvedValue(session_response(null));
		const event = make_event(href, { route_id: '/(site)/admin', cookie: 'session=expired' });
		Object.assign(event, { request: new Request(href, { method: 'POST' }) });

		const response = await handle({ event, resolve });

		expect(response.status).toBe(302);
		expect(platform_fetch).toHaveBeenCalledOnce();
		expect(resolve).not.toHaveBeenCalled();
	});

	it('is not served to a remote call that claims to come from it', async () => {
		const handle = await load_handle(true);
		const event = make_event(href, { route_id: null });
		Object.assign(event, {
			isRemoteRequest: true,
			request: new Request('http://localhost:5740/_app/remote/hash/get_feed')
		});

		const response = await handle({ event, resolve });

		expect(await response.text()).toBe('page');
	});

	it('does not exist in production', async () => {
		const handle = await load_handle(false);

		const response = await handle({ event: make_event(href, { route_id: null }), resolve });

		expect(await response.text()).toBe('page');
		expect(platform_fetch).not.toHaveBeenCalled();
	});
});
