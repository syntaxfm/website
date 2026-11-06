// Who is signed in, asked of Syntax Auth only when code needs it, and at most once per request.
// Public pages and remote functions never ask, so they don't pay the round trip (every request
// with any cookie used to). Admin pages and /login ask up front (hooks.server.ts); admin remote
// functions ask through assert_admin().
import { error, type RequestEvent } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import { add_timing } from '$server/server_timing';
import { get_authenticated_user, type AuthenticatedUser } from './authorization';
import { get_syntax_auth } from './syntax_auth';
import type { SyntaxAuthFailure } from './syntax_auth_failure';

interface RequestAuth {
	user: AuthenticatedUser | null;
	// Refreshed session cookies from Syntax Auth; the auth hook adds them to the response
	set_cookie_headers: string[];
	// Development only: why local Syntax Auth couldn't answer
	failure: SyntaxAuthFailure | null;
}

// Keyed by the Request: inside remote functions getRequestEvent() returns a wrapper around the
// event the hooks see, but both share the same Request object.
const auth_by_request = new WeakMap<Request, Promise<RequestAuth>>();

async function ask_syntax_auth(event: RequestEvent, required: boolean): Promise<RequestAuth> {
	const start = performance.now();
	const result = await get_syntax_auth(event.request.headers.get('cookie'), event.fetch, {
		required
	});
	const user = result.auth ? await get_authenticated_user(result.auth.user) : null;
	add_timing(event, 'auth', performance.now() - start);
	return { user, set_cookie_headers: result.set_cookie_headers, failure: result.failure };
}

// `required`: the page sends signed-out visitors to sign in (development asks local Syntax Auth
// even without a cookie, so a stopped Auth shows its fix).
export function get_request_auth(event: RequestEvent, { required = false } = {}) {
	let auth = auth_by_request.get(event.request);
	if (!auth) {
		auth = ask_syntax_auth(event, required);
		auth_by_request.set(event.request, auth);
	}
	return auth;
}

export async function get_request_user(event: RequestEvent) {
	return (await get_request_auth(event)).user;
}

// Session cookies Syntax Auth refreshed, if anything asked it during this request
export async function get_request_auth_cookies(event: RequestEvent) {
	const auth = auth_by_request.get(event.request);
	return auth ? (await auth).set_cookie_headers : [];
}

// For admin remote functions: the signed-in admin, or a 403
export async function assert_admin(): Promise<AuthenticatedUser> {
	const user = await get_request_user(getRequestEvent());
	if (!user?.roles.includes('admin')) error(403, 'Admin access required');
	return user;
}
