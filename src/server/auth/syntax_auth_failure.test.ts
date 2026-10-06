import { describe, expect, it } from 'vitest';

import {
	describe_syntax_auth_failure,
	syntax_auth_diagnostic_location,
	syntax_auth_diagnostic_response,
	syntax_auth_failure_response,
	type SyntaxAuthFailure
} from './syntax_auth_failure';

function request_accepting(accept: string | null): Request {
	return new Request('http://localhost:5740/admin', {
		headers: accept ? { Accept: accept } : {}
	});
}

describe('syntax_auth_failure_response', () => {
	it.each<[SyntaxAuthFailure, string]>([
		[{ kind: 'unreachable' }, 'Local Syntax Auth isn’t answering at http://localhost:37960.'],
		[{ kind: 'timeout' }, 'Local Syntax Auth didn’t answer within 5 seconds.'],
		[{ kind: 'status', status: 500 }, 'Local Syntax Auth answered with HTTP status 500.'],
		[
			{ kind: 'invalid_response' },
			'Local Syntax Auth answered with a response this site couldn’t read.'
		]
	])('describes %o exactly', (failure, description) => {
		expect(describe_syntax_auth_failure(failure)).toBe(description);
	});

	it('answers a browser page with a semantic, uncached 503 and the restart fix', async () => {
		const response = syntax_auth_failure_response(
			request_accepting('text/html,application/xhtml+xml,*/*;q=0.8'),
			'session',
			{ kind: 'unreachable' }
		);
		const html = await response.text();

		expect(response.status).toBe(503);
		expect(response.headers.get('Cache-Control')).toBe('no-store');
		expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
		expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
		expect(html).toContain('<main>');
		expect(html).toContain('<h1>Syntax Auth couldn’t check your sign-in</h1>');
		expect(html).toContain('<p>Local Syntax Auth isn’t answering at http://localhost:37960.</p>');
		expect(html).toContain('<code>pnpm dev</code>');
	});

	it.each([null, '*/*', 'application/json'])(
		'answers JSON when the request accepts %s',
		async (accept) => {
			const response = syntax_auth_failure_response(request_accepting(accept), 'sign_out', {
				kind: 'timeout'
			});

			expect(response.status).toBe(503);
			expect(response.headers.get('Cache-Control')).toBe('no-store');
			expect(response.headers.get('Content-Type')).toContain('application/json');
			await expect(response.json()).resolves.toEqual({
				error: 'syntax_auth_unavailable',
				// A client-side navigation's error page shows only the message, so it carries the fix.
				message:
					'Syntax Auth couldn’t sign you out. Local Syntax Auth didn’t answer within 5 seconds. ' +
					'Make sure Docker Desktop (or OrbStack) is running, then stop this dev server and ' +
					'start it again with pnpm dev. Starting it starts local Syntax Auth and prints any ' +
					'problem that remains.',
				fix: expect.stringContaining('pnpm dev')
			});
		}
	);
});

describe('syntax_auth_diagnostic_location', () => {
	it.each<[SyntaxAuthFailure, string]>([
		[{ kind: 'unreachable' }, 'reason=unreachable'],
		[{ kind: 'timeout' }, 'reason=timeout'],
		[{ kind: 'invalid_response' }, 'reason=invalid_response'],
		[{ kind: 'status', status: 502 }, 'reason=status&status=502']
	])('names %o by a fixed reason, with the page as an app-relative return', (failure, reason) => {
		const page = new URL('http://192.168.1.20:5740/admin/content?status=DRAFT');

		expect(syntax_auth_diagnostic_location(failure, page)).toBe(
			`/__syntax_auth_unavailable?${reason}&return_to=%2Fadmin%2Fcontent%3Fstatus%3DDRAFT`
		);
	});

	it.each([
		'http://localhost:5740//evil.example/admin',
		'http://localhost:5740/__syntax_auth/sign-in',
		'http://localhost:5740/__syntax_auth_unavailable?reason=timeout'
	])('returns home instead of %s', (href) => {
		expect(syntax_auth_diagnostic_location({ kind: 'timeout' }, new URL(href))).toBe(
			'/__syntax_auth_unavailable?reason=timeout&return_to=%2F'
		);
	});
});

describe('syntax_auth_diagnostic_response', () => {
	function diagnostic_request(search: string, method = 'GET'): Request {
		return new Request(`http://localhost:5740/__syntax_auth_unavailable${search}`, {
			method,
			headers: { Accept: '*/*', Cookie: 'better-auth.session_token=secret-cookie' }
		});
	}

	it.each<[string, string]>([
		[
			'?reason=unreachable&return_to=%2Fadmin',
			'Local Syntax Auth isn’t answering at http://localhost:37960.'
		],
		['?reason=timeout&return_to=%2Fadmin', 'Local Syntax Auth didn’t answer within 5 seconds.'],
		[
			'?reason=status&status=502&return_to=%2Fadmin',
			'Local Syntax Auth answered with HTTP status 502.'
		],
		[
			'?return_to=%2Fadmin&reason=invalid_response',
			'Local Syntax Auth answered with a response this site couldn’t read.'
		]
	])('renders %s as an uncached 503 page with the restart fix', async (search, problem) => {
		const response = syntax_auth_diagnostic_response(diagnostic_request(search));
		const html = await response?.text();

		expect(response?.status).toBe(503);
		expect(response?.headers.get('Cache-Control')).toBe('no-store');
		expect(response?.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
		expect(response?.headers.has('Set-Cookie')).toBe(false);
		expect(html).toContain('<h1>Syntax Auth couldn’t check your sign-in</h1>');
		expect(html).toContain(`<p>${problem}</p>`);
		expect(html).toContain('start it again with pnpm dev.');
		expect(html).toContain('<code>pnpm dev</code>');
		expect(html).toContain('<a href="/admin">');
		expect(html).not.toContain('secret-cookie');
	});

	it('escapes the checked return in the link', async () => {
		const return_to = '/search?q=a&c=1';
		const response = syntax_auth_diagnostic_response(
			diagnostic_request(`?${new URLSearchParams({ reason: 'timeout', return_to })}`)
		);

		expect(await response?.text()).toContain('<a href="/search?q=a&amp;c=1">');
	});

	it.each([
		['no reason', '?return_to=%2F'],
		['no return', '?reason=timeout'],
		['an unknown reason', '?reason=crashed&return_to=%2F'],
		['a reason with free text', '?reason=token%3Dsecret&return_to=%2F'],
		['a status without its code', '?reason=status&return_to=%2F'],
		['a status code that isn’t one', '?reason=status&status=5000&return_to=%2F'],
		['a status code with text', '?reason=status&status=500%20secret&return_to=%2F'],
		['a status on another reason', '?reason=timeout&status=500&return_to=%2F'],
		['a repeated reason', '?reason=timeout&reason=unreachable&return_to=%2F'],
		['an extra parameter', '?reason=timeout&return_to=%2F&message=secret'],
		['an absolute return', '?reason=timeout&return_to=https%3A%2F%2Fevil.example%2F'],
		['a protocol-relative return', '?reason=timeout&return_to=%2F%2Fevil.example%2F'],
		['a backslash return', '?reason=timeout&return_to=%2F%5Cevil.example'],
		['a script return', '?reason=timeout&return_to=javascript%3Aalert(1)'],
		['a return with a fragment', '?reason=timeout&return_to=%2Fadmin%23x'],
		['a return with markup', '?reason=timeout&return_to=%2F%22%3E%3Cscript%3E'],
		['a return with a space', '?reason=timeout&return_to=%2Fa%20b'],
		['a return that isn’t canonical', '?reason=timeout&return_to=%2F.%2Fadmin'],
		['a return to sign-in', '?reason=timeout&return_to=%2F__syntax_auth%2Fsign-in'],
		['a return to itself', '?reason=timeout&return_to=%2F__syntax_auth_unavailable']
	])('refuses %s with a fixed, uncached 400', async (_label, search) => {
		const response = syntax_auth_diagnostic_response(diagnostic_request(search));
		const body = (await response?.text()) ?? '';

		expect(response?.status).toBe(400);
		expect(response?.headers.get('Cache-Control')).toBe('no-store');
		expect(body).toBe('This Syntax Auth diagnostic link isn’t valid.');
	});

	it.each(['POST', 'PUT', 'DELETE', 'HEAD'])('leaves a %s to the normal request path', (method) => {
		expect(
			syntax_auth_diagnostic_response(
				diagnostic_request('?reason=timeout&return_to=%2Fadmin', method)
			)
		).toBeNull();
	});

	it.each([
		'http://localhost:5740/__syntax_auth_unavailablex?reason=timeout&return_to=%2F',
		'http://localhost:5740/__syntax_auth_unavailable/x?reason=timeout&return_to=%2F',
		'http://localhost:5740/admin?reason=timeout&return_to=%2F'
	])('leaves %s to the normal request path', (href) => {
		expect(syntax_auth_diagnostic_response(new Request(href))).toBeNull();
	});
});
