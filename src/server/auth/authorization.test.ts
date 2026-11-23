import { beforeEach, describe, expect, it, vi } from 'vitest';

const { find_profile, update_returning } = vi.hoisted(() => ({
	find_profile: vi.fn(),
	update_returning: vi.fn()
}));

vi.mock('$app/env', () => ({ dev: false }));

vi.mock('$server/db/client', () => ({
	db: {
		query: {
			profile: {
				findFirst: find_profile
			}
		},
		update: () => ({ set: () => ({ where: () => ({ returning: update_returning }) }) })
	}
}));

import {
	assert_admin_actor,
	get_admin_guard_response,
	get_admin_remote_guard_response,
	get_authenticated_user,
	get_profile_authorization
} from './authorization';
import type { SyntaxAuthUser } from './syntax_auth';

const central_user: SyntaxAuthUser = {
	id: 'central-user-id',
	name: 'Syntax Admin',
	email: 'admin@syntax.fm',
	emailVerified: true,
	image: null,
	createdAt: '2026-07-24T00:00:00.000Z',
	updatedAt: '2026-07-24T00:00:00.000Z'
};

describe('get_authenticated_user', () => {
	const admin_profile = { id: 'profile-id', roles: [{ role: { name: 'admin' } }] };
	const no_github_id = () => Promise.resolve(null);

	beforeEach(() => {
		find_profile.mockReset();
		update_returning.mockReset();
	});

	it('does not grant roles to a central user with no Profile for their GitHub ID', async () => {
		find_profile.mockResolvedValue(undefined);
		update_returning.mockResolvedValue([]);

		await expect(get_authenticated_user(central_user, () => Promise.resolve(42))).resolves.toEqual({
			...central_user,
			profile_id: null,
			roles: []
		});
	});

	it('does not look for a GitHub ID when no account is linked to Syntax Auth', async () => {
		find_profile.mockResolvedValue(undefined);

		await expect(get_authenticated_user(central_user, no_github_id)).resolves.toEqual({
			...central_user,
			profile_id: null,
			roles: []
		});
		expect(update_returning).not.toHaveBeenCalled();
	});

	it('loads application roles from the explicitly mapped Profile', async () => {
		find_profile.mockResolvedValue({
			id: 'profile-id',
			roles: [{ role: { name: 'admin' } }, { role: { name: 'editor' } }]
		});
		const find_github_id = vi.fn(no_github_id);

		await expect(get_authenticated_user(central_user, find_github_id)).resolves.toEqual({
			...central_user,
			profile_id: 'profile-id',
			roles: ['admin', 'editor']
		});
		expect(find_github_id).not.toHaveBeenCalled();
	});

	it('links the Profile with the same GitHub ID on first sign-in and loads its roles', async () => {
		find_profile.mockResolvedValueOnce(undefined).mockResolvedValueOnce(admin_profile);
		update_returning.mockResolvedValue([{ id: 'profile-id' }]);

		await expect(get_authenticated_user(central_user, () => Promise.resolve(42))).resolves.toEqual({
			...central_user,
			profile_id: 'profile-id',
			roles: ['admin']
		});
	});

	it('grants no roles when linking fails', async () => {
		vi.spyOn(console, 'error').mockImplementationOnce(() => undefined);
		find_profile.mockResolvedValue(undefined);
		update_returning.mockRejectedValue(new Error('connection refused'));

		await expect(get_authenticated_user(central_user, () => Promise.resolve(42))).resolves.toEqual({
			...central_user,
			profile_id: null,
			roles: []
		});
	});
});

describe('get_profile_authorization', () => {
	beforeEach(() => {
		find_profile.mockReset();
	});

	it('grants no roles while the database cannot answer', async () => {
		vi.spyOn(console, 'error').mockReturnValueOnce(undefined);
		find_profile.mockRejectedValue(new Error('connection refused'));

		await expect(get_profile_authorization('central-user-id')).resolves.toEqual({
			profile_id: null,
			roles: []
		});
	});
});

describe('assert_admin_actor', () => {
	it('refuses an actor without the admin role with 403', () => {
		expect(() =>
			assert_admin_actor({ id: 'central-user-id', profile_id: null, roles: [] })
		).toThrow(expect.objectContaining({ status: 403 }));
	});

	it('lets an admin through', () => {
		expect(() =>
			assert_admin_actor({ id: 'central-user-id', profile_id: 'profile-id', roles: ['admin'] })
		).not.toThrow();
	});
});

describe('get_admin_guard_response', () => {
	it('redirects a signed-out request to central sign-in with the current URL', () => {
		const return_to = new URL('https://syntax.fm/admin/content?status=DRAFT');
		const response = get_admin_guard_response(null, return_to);
		const location = new URL(response?.headers.get('Location') ?? '');

		expect(response?.status).toBe(302);
		expect(location.origin).toBe('https://auth.syntax.fm');
		expect(location.pathname).toBe('/sign-in');
		expect(location.searchParams.get('return_to')).toBe(return_to.href);
	});

	it.each([
		['http://localhost:5740/admin/content?status=DRAFT', '/admin/content?status=DRAFT'],
		['http://192.168.1.20:5740/admin', '/admin'],
		['http://dev.example/admin', '/admin']
	])('sends %s to sign in at its own address in development builds', async (current, return_to) => {
		vi.resetModules();
		vi.doMock('$app/env', () => ({ dev: true }));
		const development = await import('./authorization');
		const response = development.get_admin_guard_response(null, new URL(current));
		const location = response?.headers.get('Location') ?? '';

		expect(response?.status).toBe(302);
		expect(response?.headers.get('Cache-Control')).toBe('no-store');
		expect(location).toBe(`/__syntax_auth/sign-in?${new URLSearchParams({ return_to })}`);
		expect(location).not.toContain('localhost');
	});

	it('blocks an authenticated user without the application role', () => {
		const response = get_admin_guard_response(
			{ ...central_user, profile_id: null, roles: [] },
			new URL('https://syntax.fm/admin')
		);

		expect(response?.status).toBe(403);
	});

	it('allows a mapped application admin', () => {
		expect(
			get_admin_guard_response(
				{ ...central_user, profile_id: 'profile-id', roles: ['admin'] },
				new URL('https://syntax.fm/admin')
			)
		).toBeNull();
	});
});

describe('get_admin_remote_guard_response in production', () => {
	const admin_url = new URL('https://syntax.fm/admin');
	const post = new Request('https://syntax.fm/_app/remote/hash/save', { method: 'POST' });
	const user = { ...central_user, profile_id: null, roles: [] };

	it.each([
		['a signed-out', null],
		['a non-admin', user]
	])('answers %s call exactly as the page guard does', async (_label, caller) => {
		const page = get_admin_guard_response(caller, admin_url);
		const remote = get_admin_remote_guard_response(caller, admin_url, post);

		expect(remote?.status).toBe(page?.status);
		expect([...(remote?.headers ?? [])]).toEqual([...(page?.headers ?? [])]);
		expect(await remote?.text()).toBe(await page?.text());
	});

	it('lets an admin through', () => {
		expect(
			get_admin_remote_guard_response({ ...user, roles: ['admin'] }, admin_url, post)
		).toBeNull();
	});
});
