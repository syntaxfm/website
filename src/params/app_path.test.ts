import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// These run this project's real route tree and matchers through the installed SvelteKit routing
// code (not exported, so loaded from its source) — the code the client router and the server use.
type Callable = (...args: unknown[]) => unknown;
type Matcher = (param: string) => boolean;
type Route = { id: string; page: boolean; endpoint: boolean; pattern: RegExp; params: unknown };
type ClientRoute = { id: string; exec: (path: string) => unknown };
type Match = { id: string; params: unknown } | null;

const CATCH_ALL = '/(site)/[...number=app_path]';
const PREVIOUS_CATCH_ALL = '/(site)/[...number]';

const project_root = fileURLToPath(new URL('../..', import.meta.url));
const kit_root = path.dirname(createRequire(import.meta.url).resolve('@sveltejs/kit/package.json'));

function is_callable(value: unknown): value is Callable {
	return typeof value === 'function';
}

function field(value: unknown, name: string): unknown {
	return typeof value === 'object' && value !== null ? Reflect.get(value, name) : undefined;
}

async function load_installed_kit(file: string, name: string): Promise<Callable> {
	const value = field(await import(/* @vite-ignore */ path.join(kit_root, file)), name);
	if (!is_callable(value)) throw new Error(`The installed SvelteKit ${file} has no ${name}`);
	return value;
}

let routes: Route[] = [];
let matcher_files: [string, string][] = [];

beforeAll(async () => {
	const load_svelte_config = await load_installed_kit(
		'src/core/config/index.js',
		'load_svelte_config'
	);
	const create_manifest_data = await load_installed_kit(
		'src/core/sync/create_manifest_data/index.js',
		'default'
	);
	const manifest = create_manifest_data({
		config: await load_svelte_config(project_root),
		cwd: project_root
	});

	const listed = field(manifest, 'routes');
	if (!Array.isArray(listed)) throw new Error('The route manifest has no routes');
	routes = listed.map((route: unknown) => {
		const id = field(route, 'id');
		const pattern = field(route, 'pattern');
		if (typeof id !== 'string' || !(pattern instanceof RegExp)) throw new Error('Unreadable route');
		return {
			id,
			page: Boolean(field(route, 'page')),
			endpoint: Boolean(field(route, 'endpoint')),
			pattern,
			params: field(route, 'params')
		};
	});

	matcher_files = Object.entries(field(manifest, 'matchers') ?? {}).map(([name, file]) => {
		if (typeof file !== 'string') throw new Error(`Unreadable matcher ${name}`);
		return [name, file];
	});
});

async function load_matchers(dev: boolean): Promise<Record<string, Matcher>> {
	vi.resetModules();
	vi.doMock('$app/environment', () => ({ dev }));
	const matchers: Record<string, Matcher> = {};
	for (const [name, file] of matcher_files) {
		const match = field(await import(/* @vite-ignore */ path.join(project_root, file)), 'match');
		if (!is_callable(match)) throw new Error(`${file} exports no match`);
		matchers[name] = (param) => Boolean(match(param));
	}
	return matchers;
}

/** The page routes as the installed client router builds them (parse.js). */
async function client_routes(dev: boolean): Promise<ClientRoute[]> {
	const parse = await load_installed_kit('src/runtime/client/parse.js', 'parse');
	const dictionary = Object.fromEntries(
		routes.filter((route) => route.page).map((route) => [route.id, [0]])
	);
	const parsed = parse({
		nodes: [],
		server_loads: [],
		dictionary,
		matchers: await load_matchers(dev)
	});
	if (!Array.isArray(parsed)) throw new Error('The client router parsed no routes');
	return parsed.map((route: unknown) => {
		const id = field(route, 'id');
		const exec = field(route, 'exec');
		if (typeof id !== 'string' || !is_callable(exec)) throw new Error('Unreadable client route');
		return { id, exec: (path) => exec(path) };
	});
}

/** The installed client router's route lookup (get_navigation_intent). */
function client_match(client: ClientRoute[], pathname: string): Match {
	for (const route of client) {
		const params = route.exec(pathname);
		if (params) return { id: route.id, params };
	}
	return null;
}

/** The installed server's route lookup (find_route) over every page and endpoint route. */
async function server_match(dev: boolean, pathname: string, previous = false): Promise<Match> {
	const find_route = await load_installed_kit('src/utils/routing.js', 'find_route');
	const parse_route_id = await load_installed_kit('src/utils/routing.js', 'parse_route_id');
	const previous_route = parse_route_id(PREVIOUS_CATCH_ALL);
	const served = routes
		.filter((route) => route.page || route.endpoint)
		.map((route) =>
			previous && route.id === CATCH_ALL
				? {
						id: PREVIOUS_CATCH_ALL,
						pattern: field(previous_route, 'pattern'),
						params: field(previous_route, 'params')
					}
				: route
		);
	const found = find_route(pathname, served, await load_matchers(dev));
	if (found === null) return null;
	const id = field(field(found, 'route'), 'id');
	if (typeof id !== 'string') throw new Error('Unreadable matched route');
	return { id, params: field(found, 'params') };
}

type LoadResult = { type: 'loaded' } | { type: 'redirect'; location: string };
type NavigationEnd =
	| { type: 'client'; route_id: string; href: string }
	| { type: 'document'; href: string };

// Stand-in for navigate() in the installed client.js, pinned by the source check below: with no
// matching route it calls server_fallback, which loads the URL as a full document
// (native_navigation); a load that redirects navigates again to the new URL.
async function navigate(
	client: ClientRoute[],
	url: URL,
	load: (route_id: string) => LoadResult,
	redirect_count = 0
): Promise<NavigationEnd> {
	const intent = client_match(client, url.pathname);
	if (!intent) return { type: 'document', href: url.href };
	const result = load(intent.id);
	if (result.type === 'redirect' && redirect_count < 20) {
		return navigate(client, new URL(result.location, url), load, redirect_count + 1);
	}
	return { type: 'client', route_id: intent.id, href: url.href };
}

// A signed-out admin page-data request, as the hook answers it in development.
const sign_in = `/__syntax_auth/sign-in?${new URLSearchParams({ return_to: '/admin' })}`;
function signed_out(route_id: string): LoadResult {
	return route_id.startsWith('/(site)/admin')
		? { type: 'redirect', location: sign_in }
		: { type: 'loaded' };
}

const ordinary_paths: [string, string, unknown][] = [
	['/', '/(site)', {}],
	['/123', CATCH_ALL, { number: '123' }],
	['/not-a-page', CATCH_ALL, { number: 'not-a-page' }],
	['/a/b/c', CATCH_ALL, { number: 'a/b/c' }],
	['/__syntax_authx', CATCH_ALL, { number: '__syntax_authx' }],
	['/x/__syntax_auth/sign-in', CATCH_ALL, { number: 'x/__syntax_auth/sign-in' }],
	['/__syntax_auth_unavailablex', CATCH_ALL, { number: '__syntax_auth_unavailablex' }],
	['/x/__syntax_auth_unavailable', CATCH_ALL, { number: 'x/__syntax_auth_unavailable' }],
	['/login', '/(site)/login', {}],
	['/admin', '/(site)/admin', {}],
	[
		'/show/900/some-slug',
		'/(site)/show/[show_number]/[slug]',
		{ show_number: '900', slug: 'some-slug' }
	],
	['/show/900', '/(site)/show/[...all]', { all: '900' }],
	['/shows', '/(site)/shows', {}]
];
// The development diagnostic page the auth hook renders itself (src/server/auth/syntax_auth_failure.ts).
const diagnostic_paths = ['/__syntax_auth_unavailable', '/__syntax_auth_unavailable/x'];
const gateway_paths = [
	'/__syntax_auth',
	'/__syntax_auth/',
	'/__syntax_auth/sign-in',
	...diagnostic_paths
];

describe('app_path matcher', () => {
	it('is the matcher on the catch-all show-number route', () => {
		expect(routes.map((route) => route.id)).toContain(CATCH_ALL);
		expect(routes.map((route) => route.id)).not.toContain(PREVIOUS_CATCH_ALL);
	});

	it.each([true, false])('routes ordinary paths as before (dev: %s)', async (dev) => {
		const client = await client_routes(dev);
		for (const [pathname, id, params] of ordinary_paths) {
			expect(client_match(client, pathname), pathname).toEqual({ id, params });
			expect(await server_match(dev, pathname), pathname).toEqual({ id, params });
		}
	});

	it('leaves the Syntax Auth gateway and diagnostic page unmatched in development', async () => {
		const client = await client_routes(true);
		for (const pathname of gateway_paths) {
			expect(client_match(client, pathname), pathname).toBeNull();
			expect(await server_match(true, pathname), pathname).toBeNull();
		}
	});

	it('matches every path in production exactly as the matcherless route did', async () => {
		const client = await client_routes(false);
		for (const pathname of [...ordinary_paths.map(([pathname]) => pathname), ...gateway_paths]) {
			const previous = await server_match(false, pathname, true);
			const renamed = (match: Match): Match =>
				match && { ...match, id: match.id === CATCH_ALL ? PREVIOUS_CATCH_ALL : match.id };
			expect(renamed(await server_match(false, pathname)), pathname).toEqual(previous);
			expect(renamed(client_match(client, pathname)), pathname).toEqual(previous);
		}
		expect(client_match(client, '/__syntax_auth/sign-in')).toEqual({
			id: CATCH_ALL,
			params: { number: '__syntax_auth/sign-in' }
		});
		expect(client_match(client, '/__syntax_auth_unavailable')).toEqual({
			id: CATCH_ALL,
			params: { number: '__syntax_auth_unavailable' }
		});
	});

	it('loads the diagnostic page a remote call redirects to as a full page in development', async () => {
		const client = await client_routes(true);
		const origin = 'http://localhost:5740';
		const diagnostic = '/__syntax_auth_unavailable?reason=timeout&return_to=%2Fadmin';
		await expect(navigate(client, new URL(diagnostic, origin), signed_out)).resolves.toEqual({
			type: 'document',
			href: `${origin}${diagnostic}`
		});
	});

	it('loads the gateway as a full page in development, even after a redirect', async () => {
		const client = await client_routes(true);
		const origin = 'http://localhost:5740';
		await expect(navigate(client, new URL('/admin', origin), signed_out)).resolves.toEqual({
			type: 'document',
			href: `${origin}${sign_in}`
		});
		await expect(navigate(client, new URL(sign_in, origin), signed_out)).resolves.toEqual({
			type: 'document',
			href: `${origin}${sign_in}`
		});
		await expect(navigate(client, new URL('/123', origin), signed_out)).resolves.toEqual({
			type: 'client',
			route_id: CATCH_ALL,
			href: `${origin}/123`
		});
	});

	it('pins the installed client router the stand-in mirrors', async () => {
		const source = await readFile(path.join(kit_root, 'src/runtime/client/client.js'), 'utf8');
		const navigate_source = source.slice(source.indexOf('async function navigate({'));
		const fallback_source = source.slice(source.indexOf('async function server_fallback('));
		expect(navigate_source).toContain(
			'let navigation_result = intent && (await load_route(intent));'
		);
		expect(navigate_source).toMatch(
			/if \(!navigation_result\) \{[^]*?\} else \{\s*navigation_result = await server_fallback\(/
		);
		expect(navigate_source).toContain('url: new URL(navigation_result.location, url),');
		expect(fallback_source.slice(0, fallback_source.indexOf('\n}\n'))).toContain(
			'return await native_navigation(url, replace_state);'
		);
	});
});
