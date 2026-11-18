import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	access_token_claims_fixture,
	key_set_fetch_fixture,
	open_signing_key_fixture,
	unsigned_access_token_fixture
} from './mcp_access_token.fixture';

vi.mock('$app/env', () => ({ dev: false }));
vi.mock('$app/env/private', () => ({ SYNTAX_AUTH_PUBLIC_ORIGINS: undefined }));

// The key Syntax Auth signs with in these tests, and one with the same key ID it never published
const syntax_auth_key = await open_signing_key_fixture('syntax-auth-key-1');
const impostor_key = await open_signing_key_fixture('syntax-auth-key-1');

const CENTRAL_USER_ID = 'central-user-7c1d';
const CHALLENGE =
	'resource_metadata="https://beta.syntax.fm/.well-known/oauth-protected-resource/mcp", scope="openid profile email offline_access"';

function mcp_request_with(authorization?: string) {
	return new Request('https://beta.syntax.fm/mcp', {
		method: 'POST',
		headers: authorization === undefined ? {} : { Authorization: authorization }
	});
}

// The key set is cached per module, as per Worker isolate, so each test loads a fresh module
async function load_token_check() {
	vi.resetModules();
	return (await import('./mcp_access_token')).check_mcp_access_token;
}

describe('check_mcp_access_token', () => {
	beforeEach(() => {
		vi.spyOn(console, 'error').mockReturnValue(undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it("accepts a token Syntax Auth signed for this site's /mcp URL and reads its claims", async () => {
		const check_mcp_access_token = await load_token_check();
		const { key_set_fetch } = key_set_fetch_fixture([syntax_auth_key.published_key]);
		const claims = access_token_claims_fixture(CENTRAL_USER_ID);
		const access_token = await syntax_auth_key.sign_access_token(claims);

		const token_check = await check_mcp_access_token(
			mcp_request_with(`Bearer ${access_token}`),
			key_set_fetch
		);

		expect(token_check).toEqual({
			is_signed_in: true,
			claims: { iss: claims.iss, sub: CENTRAL_USER_ID, aud: claims.aud, exp: claims.exp }
		});
		expect(key_set_fetch).toHaveBeenCalledWith(
			'https://auth.syntax.fm/api/auth/jwks',
			expect.objectContaining({ cache: 'no-store' })
		);
	});

	it('answers a request without a token with 401 and where to sign in', async () => {
		const check_mcp_access_token = await load_token_check();
		const { key_set_fetch } = key_set_fetch_fixture([syntax_auth_key.published_key]);

		const token_check = await check_mcp_access_token(mcp_request_with(), key_set_fetch);

		expect(token_check.is_signed_in).toBe(false);
		if (token_check.is_signed_in) return;
		expect(token_check.response.status).toBe(401);
		expect(token_check.response.headers.get('WWW-Authenticate')).toBe(`Bearer ${CHALLENGE}`);
		expect(token_check.response.headers.get('Cache-Control')).toBe('no-store');
		expect(key_set_fetch).not.toHaveBeenCalled();
	});

	it.each([
		[
			'signed by a key Syntax Auth never published',
			() => impostor_key.sign_access_token(access_token_claims_fixture(CENTRAL_USER_ID))
		],
		[
			'unsigned',
			() =>
				Promise.resolve(unsigned_access_token_fixture(access_token_claims_fixture(CENTRAL_USER_ID)))
		],
		[
			'for another audience',
			() =>
				syntax_auth_key.sign_access_token({
					...access_token_claims_fixture(CENTRAL_USER_ID),
					aud: 'https://lab.syntax.fm/mcp'
				})
		],
		[
			'from another issuer',
			() =>
				syntax_auth_key.sign_access_token({
					...access_token_claims_fixture(CENTRAL_USER_ID),
					iss: 'https://evil.example/api/auth'
				})
		],
		[
			'expired',
			() =>
				syntax_auth_key.sign_access_token({
					...access_token_claims_fixture(CENTRAL_USER_ID),
					exp: Math.floor(Date.now() / 1000) - 1
				})
		],
		[
			'not valid yet',
			() =>
				syntax_auth_key.sign_access_token({
					...access_token_claims_fixture(CENTRAL_USER_ID),
					nbf: Math.floor(Date.now() / 1000) + 600
				})
		],
		[
			'without a subject',
			() =>
				syntax_auth_key.sign_access_token({
					...access_token_claims_fixture(CENTRAL_USER_ID),
					sub: ''
				})
		],
		['not a JWT', () => Promise.resolve('opaque-token-7f3a')]
	])('refuses a token %s with 401 and invalid_token', async (_token_kind, sign_access_token) => {
		const check_mcp_access_token = await load_token_check();
		const { key_set_fetch } = key_set_fetch_fixture([syntax_auth_key.published_key]);

		const token_check = await check_mcp_access_token(
			mcp_request_with(`Bearer ${await sign_access_token()}`),
			key_set_fetch
		);

		expect(token_check.is_signed_in).toBe(false);
		if (token_check.is_signed_in) return;
		expect(token_check.response.status).toBe(401);
		expect(token_check.response.headers.get('WWW-Authenticate')).toBe(
			`Bearer ${CHALLENGE}, error="invalid_token"`
		);
	});

	it('reads the key set again for an unknown key ID at most once every 30 seconds', async () => {
		vi.useFakeTimers({ toFake: ['Date'], now: new Date('2027-01-01T12:00:00.000Z') });
		const check_mcp_access_token = await load_token_check();
		const { key_set_fetch } = key_set_fetch_fixture([syntax_auth_key.published_key]);
		const claims = access_token_claims_fixture(CENTRAL_USER_ID);
		const unknown_key_token = await syntax_auth_key.sign_access_token(claims, 'made-up-key-id');
		const request = () => mcp_request_with(`Bearer ${unknown_key_token}`);

		expect((await check_mcp_access_token(request(), key_set_fetch)).is_signed_in).toBe(false);
		expect((await check_mcp_access_token(request(), key_set_fetch)).is_signed_in).toBe(false);
		expect(key_set_fetch).toHaveBeenCalledTimes(1);

		vi.setSystemTime(new Date('2027-01-01T12:00:31.000Z'));
		await check_mcp_access_token(request(), key_set_fetch);
		expect(key_set_fetch).toHaveBeenCalledTimes(2);
	});

	it('shares one key set read among concurrent requests', async () => {
		const check_mcp_access_token = await load_token_check();
		const { key_set_fetch } = key_set_fetch_fixture([syntax_auth_key.published_key]);
		const access_token = await syntax_auth_key.sign_access_token(
			access_token_claims_fixture(CENTRAL_USER_ID)
		);

		const token_checks = await Promise.all(
			[1, 2, 3].map(() =>
				check_mcp_access_token(mcp_request_with(`Bearer ${access_token}`), key_set_fetch)
			)
		);

		expect(token_checks.every((token_check) => token_check.is_signed_in)).toBe(true);
		expect(key_set_fetch).toHaveBeenCalledTimes(1);
	});

	it("answers 503 when Syntax Auth's keys can't be read, and waits 30 seconds before asking again", async () => {
		vi.useFakeTimers({ toFake: ['Date'], now: new Date('2027-01-01T12:00:00.000Z') });
		const check_mcp_access_token = await load_token_check();
		const { key_set_fetch, answer } = key_set_fetch_fixture([syntax_auth_key.published_key]);
		const access_token = await syntax_auth_key.sign_access_token(
			access_token_claims_fixture(CENTRAL_USER_ID)
		);
		const request = () => mcp_request_with(`Bearer ${access_token}`);

		answer.failure = new Error('connect ECONNREFUSED');
		const unavailable = await check_mcp_access_token(request(), key_set_fetch);
		expect(unavailable.is_signed_in ? null : unavailable.response.status).toBe(503);

		answer.failure = null;
		const still_waiting = await check_mcp_access_token(request(), key_set_fetch);
		expect(still_waiting.is_signed_in ? null : still_waiting.response.status).toBe(503);
		expect(key_set_fetch).toHaveBeenCalledTimes(1);

		vi.setSystemTime(new Date('2027-01-01T12:00:31.000Z'));
		expect((await check_mcp_access_token(request(), key_set_fetch)).is_signed_in).toBe(true);
		expect(key_set_fetch).toHaveBeenCalledTimes(2);
	});
});
