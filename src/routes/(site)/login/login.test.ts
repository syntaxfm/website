import { isRedirect, type Redirect } from '@sveltejs/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { private_env } = vi.hoisted(() => ({
	private_env: {} as Record<string, string | undefined>
}));
vi.mock('$env/dynamic/private', () => ({ env: private_env }));

async function load_login(dev: boolean) {
	vi.resetModules();
	vi.doMock('$app/environment', () => ({ dev }));
	return (await import('./+page.server')).load;
}

type LoginLoad = Awaited<ReturnType<typeof load_login>>;

// The Sentry plugin wraps load functions in tests too, so the load is awaited and has a request.
async function run_login(load: LoginLoad, href: string, signed_in = false) {
	const set_headers = vi.fn();
	const event = {
		url: new URL(href),
		request: new Request(href),
		route: { id: '/(site)/login' },
		locals: { user: signed_in ? { id: 'local-developer' } : null },
		setHeaders: set_headers
	} as unknown as Parameters<LoginLoad>[0];

	let outcome: unknown;
	try {
		outcome = await load(event);
	} catch (error) {
		if (!isRedirect(error)) throw error;
		return { redirect: error as Redirect, set_headers };
	}
	return { data: outcome, set_headers };
}

afterEach(() => {
	delete private_env.SYNTAX_AUTH_PUBLIC_ORIGINS;
});

describe('/login in development', async () => {
	const load = await load_login(true);

	it.each([
		['http://localhost:5740/login', '/'],
		[
			'http://localhost:5740/login?return_to=/admin/content%3Fstatus%3DDRAFT',
			'/admin/content?status=DRAFT'
		],
		['http://192.168.1.20:5740/login?return_to=http://192.168.1.20:5740/admin', '/admin'],
		['http://mini.tailnet.ts.net:5740/login?return_to=/admin', '/admin'],
		['http://dev.example/login?return_to=https://dev.example/admin', '/admin'],
		['http://localhost:5740/login?return_to=https://evil.example/admin', '/'],
		['http://localhost:5740/login?return_to=//evil.example/admin', '/'],
		['http://localhost:5740/login?return_to=http://127.0.0.1:5740/admin', '/'],
		['http://localhost:5740/login?return_to=http://localhost:37960/', '/'],
		['http://localhost:5740/login?return_to=http://[bad', '/']
	])('sends %s to sign in at its own address, returning to %s', async (href, return_to) => {
		private_env.SYNTAX_AUTH_PUBLIC_ORIGINS = 'https://dev.example';

		const { redirect, set_headers } = await run_login(load, href);

		expect(redirect?.status).toBe(302);
		expect(redirect?.location).toBe(`/__syntax_auth/sign-in?${new URLSearchParams({ return_to })}`);
		expect(set_headers).toHaveBeenCalledWith({ 'Cache-Control': 'no-store' });
	});

	it('shows the account page to a signed-in visitor', async () => {
		const { data, redirect } = await run_login(
			load,
			'http://localhost:5740/login?return_to=/admin',
			true
		);

		expect(redirect).toBeUndefined();
		expect(data).toEqual({});
	});
});

describe('/login in production', async () => {
	const load = await load_login(false);

	it.each([
		['https://syntax.fm/login', 'https://syntax.fm/'],
		['https://syntax.fm/login?return_to=/admin', 'https://syntax.fm/admin'],
		['https://syntax.fm/login?return_to=https://admin.syntax.fm/x', 'https://admin.syntax.fm/x'],
		['https://syntax.fm/login?return_to=https://evil.example/', 'https://syntax.fm/'],
		['https://syntax.fm/login?return_to=http://localhost:5740/admin', 'https://syntax.fm/']
	])('sends %s to central sign-in, returning to %s', async (href, return_to) => {
		const { redirect, set_headers } = await run_login(load, href);
		const location = new URL(redirect?.location ?? '');

		expect(redirect?.status).toBe(302);
		expect(location.origin + location.pathname).toBe('https://auth.syntax.fm/sign-in');
		expect(location.searchParams.get('return_to')).toBe(return_to);
		expect(set_headers).toHaveBeenCalledWith({});
	});
});
