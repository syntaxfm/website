import { json, text } from '@sveltejs/kit';

import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

import {
	log_syntax_auth_failure,
	syntax_auth_diagnostic_location,
	syntax_auth_failure_message,
	syntax_auth_failure_response,
	type SyntaxAuthFailure
} from './syntax_auth_failure';

// Dev uses the shared local Syntax Auth (@syntaxfm/auth-local). Production is fixed in code so no
// environment setting can point it anywhere else.
const SYNTAX_AUTH_ORIGIN = dev ? 'http://localhost:37960' : 'https://auth.syntax.fm';
const SYNTAX_SESSION_URL = `${SYNTAX_AUTH_ORIGIN}/api/auth/get-session`;
const SYNTAX_SIGN_OUT_URL = `${SYNTAX_AUTH_ORIGIN}/api/auth/sign-out`;
// Browsers sign in here only in production builds.
const PRODUCTION_SIGN_IN_URL = 'https://auth.syntax.fm/sign-in';

// In development, browsers sign in through @syntaxfm/auth-local's same-origin proxy, so the website
// works on whatever address it is opened at (localhost, a LAN or Tailscale address, or a name behind
// the developer's own HTTPS proxy) and never sends a visitor to localhost:37960.
const DEVELOPMENT_AUTH_MOUNT_PATH = '/__syntax_auth';
const DEVELOPMENT_SIGN_IN_PATH = `${DEVELOPMENT_AUTH_MOUNT_PATH}/sign-in`;
// Development only: the private header naming the browser origin this server checked, which local
// Syntax Auth trusts for that one request. Browsers can't send it there; deployed Auth ignores it.
const DEVELOPMENT_ORIGIN_HEADER = 'x-syntax-auth-dev-origin';
// Development only: browser-facing origins the request alone doesn't show, such as an HTTPS proxy's
// `https://dev.example`. The same setting @syntaxfm/auth-local reads (see vite.config.ts).
const PUBLIC_ORIGINS_VARIABLE = 'SYNTAX_AUTH_PUBLIC_ORIGINS';

// Development requests to local Syntax Auth, body included, must finish within this time so a
// stalled Auth shows its fix instead of hanging the page. Production timing is unchanged.
export const DEVELOPMENT_AUTH_TIMEOUT_MS = 5_000;

type ServerFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface SyntaxAuthUser {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface SyntaxAuthSession {
	id: string;
	userId: string;
	expiresAt: string;
	createdAt: string;
	updatedAt: string;
}

export interface SyntaxAuthContext {
	user: SyntaxAuthUser;
	session: SyntaxAuthSession;
}

interface SyntaxAuthResult {
	auth: SyntaxAuthContext | null;
	set_cookie_headers: string[];
	/** Development only: why local Syntax Auth couldn't answer. Production treats it as signed out. */
	failure: SyntaxAuthFailure | null;
}

function is_record(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function is_nullable_string(value: unknown): value is string | null {
	return typeof value === 'string' || value === null;
}

function parse_auth_context(value: unknown): SyntaxAuthContext | null {
	if (!is_record(value) || !is_record(value.user) || !is_record(value.session)) {
		return null;
	}

	const { user, session } = value;
	if (
		typeof user.id !== 'string' ||
		typeof user.name !== 'string' ||
		typeof user.email !== 'string' ||
		typeof user.emailVerified !== 'boolean' ||
		!is_nullable_string(user.image) ||
		typeof user.createdAt !== 'string' ||
		typeof user.updatedAt !== 'string' ||
		typeof session.id !== 'string' ||
		typeof session.userId !== 'string' ||
		typeof session.expiresAt !== 'string' ||
		typeof session.createdAt !== 'string' ||
		typeof session.updatedAt !== 'string' ||
		session.userId !== user.id
	) {
		return null;
	}

	return {
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			emailVerified: user.emailVerified,
			image: user.image,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		},
		session: {
			id: session.id,
			userId: session.userId,
			expiresAt: session.expiresAt,
			createdAt: session.createdAt,
			updatedAt: session.updatedAt
		}
	};
}

function get_set_cookie_headers(response: Response): string[] {
	return response.headers.getSetCookie();
}

function discard_body(response: Response): void {
	if (response.body && !response.bodyUsed) {
		response.body.cancel().catch(() => undefined);
	}
}

interface Deadline {
	signal: AbortSignal;
	clear(): void;
}

function start_deadline(): Deadline {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), DEVELOPMENT_AUTH_TIMEOUT_MS);
	return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

// Settles with `promise`, or rejects once the deadline passes even if `promise` ignores the signal.
async function before_deadline<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
	// A promise that loses the race may reject later; that rejection is expected and handled here.
	promise.catch(() => undefined);
	if (signal.aborted) {
		throw new Error('Deadline passed');
	}

	let on_abort: () => void = () => undefined;
	const aborted = new Promise<never>((_resolve, reject) => {
		on_abort = () => reject(new Error('Deadline passed'));
		signal.addEventListener('abort', on_abort, { once: true });
	});
	try {
		return await Promise.race([promise, aborted]);
	} finally {
		signal.removeEventListener('abort', on_abort);
	}
}

function development_failure(
	failure: SyntaxAuthFailure,
	set_cookie_headers: string[]
): SyntaxAuthResult {
	log_syntax_auth_failure('session', failure);
	return { auth: null, set_cookie_headers, failure };
}

// Development calls use the platform fetch, not SvelteKit's event.fetch: event.fetch rebuilds the
// Cookie header for requests to the page's own hostname (localhost) and adds the page's Origin, and
// local Syntax Auth must receive the browser's Cookie header exactly as sent.
async function get_development_syntax_auth(
	cookie_header: string | null,
	required: boolean
): Promise<SyntaxAuthResult> {
	if (!cookie_header && !required) {
		return { auth: null, set_cookie_headers: [], failure: null };
	}

	const deadline = start_deadline();
	try {
		let response: Response;
		try {
			response = await before_deadline(
				fetch(SYNTAX_SESSION_URL, {
					headers: cookie_header
						? { 'Cache-Control': 'no-store', Cookie: cookie_header }
						: { 'Cache-Control': 'no-store' },
					cache: 'no-store',
					redirect: 'manual',
					signal: deadline.signal
				}),
				deadline.signal
			);
		} catch {
			return development_failure({ kind: deadline.signal.aborted ? 'timeout' : 'unreachable' }, []);
		}

		const set_cookie_headers = get_set_cookie_headers(response);
		if (!response.ok) {
			discard_body(response);
			return development_failure({ kind: 'status', status: response.status }, set_cookie_headers);
		}

		let body: unknown;
		try {
			body = await before_deadline(response.json(), deadline.signal);
		} catch {
			discard_body(response);
			return development_failure(
				{ kind: deadline.signal.aborted ? 'timeout' : 'invalid_response' },
				set_cookie_headers
			);
		}

		// Better Auth answers `null` for a signed-out request; anything else must be a session.
		const auth = parse_auth_context(body);
		if (body !== null && !auth) {
			return development_failure({ kind: 'invalid_response' }, set_cookie_headers);
		}
		return { auth, set_cookie_headers, failure: null };
	} finally {
		deadline.clear();
	}
}

/**
 * Reads the central session for this request. `required` marks requests where sign-in matters (a
 * protected page): in development they ask local Syntax Auth even without a cookie, so a stopped
 * Auth reports its fix instead of hiding behind a signed-out visit. Production never asks without a
 * cookie and treats any failure as signed out.
 */
export async function get_syntax_auth(
	cookie_header: string | null,
	server_fetch: ServerFetch,
	options: { required?: boolean } = {}
): Promise<SyntaxAuthResult> {
	if (dev) {
		return get_development_syntax_auth(cookie_header, options.required ?? false);
	}

	if (!cookie_header) {
		return { auth: null, set_cookie_headers: [], failure: null };
	}

	let response: Response;
	try {
		response = await server_fetch(SYNTAX_SESSION_URL, {
			headers: {
				'Cache-Control': 'no-store',
				Cookie: cookie_header
			},
			cache: 'no-store'
		});
	} catch {
		console.error('Syntax Auth session request failed');
		return { auth: null, set_cookie_headers: [], failure: null };
	}

	const set_cookie_headers = get_set_cookie_headers(response);
	if (!response.ok) {
		return { auth: null, set_cookie_headers, failure: null };
	}

	try {
		return {
			auth: parse_auth_context(await response.json()),
			set_cookie_headers,
			failure: null
		};
	} catch {
		// The parser's message can quote the response body, so it is never logged.
		console.error('Syntax Auth returned an invalid session response');
		return { auth: null, set_cookie_headers, failure: null };
	}
}

/** Production: whether a URL belongs to a trusted Syntax app. Development checks own_origins. */
export function is_trusted_syntax_url(url: URL): boolean {
	if (url.username !== '' || url.password !== '') {
		return false;
	}

	return (
		url.protocol === 'https:' &&
		(url.hostname === 'syntax.fm' || url.hostname.endsWith('.syntax.fm'))
	);
}

// The canonical form of a configured origin (http or https, no credentials, path, query, or
// fragment; a trailing "/" is allowed), or null. The same rule as @syntaxfm/auth-local, which stops
// the dev server on a value that fails it.
function canonical_origin(value: string): string | null {
	try {
		const url = new URL(value);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
		if (url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
		const given = value.toLowerCase();
		return given === url.origin || given === `${url.origin}/` ? url.origin : null;
	} catch {
		return null;
	}
}

/**
 * Development: the origins a browser may have for this request's address. The one the request
 * itself shows, plus each SYNTAX_AUTH_PUBLIC_ORIGINS origin with this very host and port, such as
 * the https origin of the developer's TLS proxy. Forwarded-protocol headers are never read.
 */
function get_own_origins(app_url: URL): string[] {
	const configured = (env[PUBLIC_ORIGINS_VARIABLE] ?? '')
		.split(/[\s,]+/)
		.map(canonical_origin)
		.filter((origin): origin is string => origin !== null)
		.filter((origin) => new URL(`${new URL(origin).protocol}//${app_url.host}`).origin === origin);
	return [...new Set([app_url.origin, ...configured])];
}

// An app-relative path and query (never `//host` or the sign-in proxy's own paths), so the return
// can't leave the address the browser used or loop through sign-in.
function get_app_relative_path(url: URL): string {
	const { pathname } = url;
	const is_proxy_path =
		pathname === DEVELOPMENT_AUTH_MOUNT_PATH ||
		pathname.startsWith(`${DEVELOPMENT_AUTH_MOUNT_PATH}/`);
	return pathname.startsWith('//') || is_proxy_path ? '/' : `${pathname}${url.search}`;
}

/**
 * Where to return after signing in, from a `return_to` the browser asked for (absolute or
 * relative), or this app's home page. Production accepts only trusted Syntax URLs. Development
 * accepts only this site's own origins, so a page opened at a network or HTTPS address returns there.
 */
export function get_sign_in_return_to(requested: string | null, app_url: URL): URL {
	const home = new URL('/', app_url);
	if (!requested) {
		return home;
	}

	let candidate: URL;
	try {
		candidate = new URL(requested, app_url);
	} catch {
		return home;
	}

	if (!dev) {
		return is_trusted_syntax_url(candidate) ? candidate : home;
	}

	const is_own =
		candidate.username === '' &&
		candidate.password === '' &&
		get_own_origins(app_url).includes(candidate.origin);
	return is_own ? candidate : home;
}

export interface SignInRedirect {
	location: string;
	headers: Record<string, string>;
}

/**
 * Where to send a signed-out browser so it comes back to `return_to`, for the admin guard and
 * /login alike. Production: central sign-in with the absolute URL, when it is trusted. Development:
 * the app-relative sign-in path at the browser's own address, with an app-relative return. It is
 * relative because the dev server can't know the browser's scheme behind an HTTPS proxy, so an
 * absolute URL would downgrade the browser to http; it is never localhost:37960.
 */
export function get_sign_in_redirect(return_to: URL): SignInRedirect {
	if (dev) {
		const query = new URLSearchParams({ return_to: get_app_relative_path(return_to) });
		return {
			location: `${DEVELOPMENT_SIGN_IN_PATH}?${query}`,
			headers: { 'Cache-Control': 'no-store' }
		};
	}

	const sign_in_url = new URL(PRODUCTION_SIGN_IN_URL);
	if (is_trusted_syntax_url(return_to)) {
		sign_in_url.searchParams.set('return_to', return_to.href);
	}
	return { location: sign_in_url.href, headers: {} };
}

export function sign_in_redirect_response(return_to: URL): Response {
	const { location, headers } = get_sign_in_redirect(return_to);
	return new Response(null, { status: 302, headers: { ...headers, Location: location } });
}

/**
 * Development: `response` as the answer to a client-side navigation's data request (`__data.json`).
 * SvelteKit replaces a redirect that a handle hook returns for a data request with its own JSON
 * redirect, dropping every header of the hook's response, Set-Cookie included. So a redirect becomes
 * that same JSON redirect here, before Syntax Auth's cookies are added. Any other response, and every
 * production response, is returned as is.
 */
export function as_data_request_response(response: Response): Response {
	const location = response.headers.get('location');
	if (!dev || response.status < 300 || response.status > 308 || !location) {
		return response;
	}

	// Built as SvelteKit builds its own (redirect_json_response in its server data module).
	return text(JSON.stringify({ type: 'redirect', location }), {
		headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' }
	});
}

/**
 * Development: `response` as the answer to a remote function call (`/_app/remote/...`). SvelteKit
 * passes a handle hook's response to a remote call through as is, and its client (remote_request in
 * its client remote-functions module) fails any answer but an OK JSON result with a generic "Failed
 * to execute remote function", after fetch has followed a redirect away from the page. So a
 * redirect becomes the result SvelteKit itself sends when a remote function redirects
 * (handle_remote_call_internal in its server remote module): HTTP 200 whose `data` is the devalue
 * encoding of `{ redirect: location }`, which the client's queries pass to goto. Only a remote read
 * may get it (see is_remote_read). Any other response, and every production response, is returned
 * as is.
 */
export function as_remote_request_response(response: Response): Response {
	const location = response.headers.get('location');
	if (!dev || response.status < 300 || response.status > 308 || !location) {
		return response;
	}

	// devalue's encoding of `{ redirect: location }` (devalue is SvelteKit's dependency, not this
	// site's): a JSON array of the values, the root object first, each property naming its value by
	// index. syntax_auth.test.ts checks it against the installed SvelteKit's own encoder.
	const data = JSON.stringify([{ redirect: 1 }, location]);
	return json({ type: 'result', data }, { headers: { 'cache-control': 'private, no-store' } });
}

/**
 * Whether a remote call the hook answers early may be answered with a redirect. The hook can't see
 * which kind of remote function a call names: SvelteKit loads the function and reads its type only
 * inside resolve (handle_remote_call_internal in its server remote module). So the method decides,
 * failing closed. A GET is a query (or prerender): commands, forms, and query.batch are always
 * sent as a POST by SvelteKit's client, and a GET can't run them (form and query.batch refuse it; a
 * command needs the JSON body a GET can't carry). Anything else gets an error result instead, even a
 * query.batch read, because an error runs nothing, can't be replayed, and still shows the fix,
 * while a redirect would reach a command as "Redirects are not allowed in commands".
 */
export function is_remote_read(request: Request): boolean {
	return request.method === 'GET';
}

/**
 * Development: a remote function's error result, built as SvelteKit builds the one it sends when a
 * remote function throws `error(status, ...)` (handle_remote_call_internal): HTTP 200, so the client
 * (remote_request) throws an HttpError with this `status` and `error`, instead of the generic
 * "Failed to execute remote function" it gives any non-OK answer. `error` holds only fixed text and,
 * for a sign-in, the app-relative sign-in path.
 */
export function remote_error_response(
	status: number,
	error: { message: string; sign_in?: string }
): Response {
	return json(
		{ type: 'error', error, status },
		{ headers: { 'cache-control': 'private, no-store' } }
	);
}

/**
 * Development: the answer to a remote call on a sign-in page when local Syntax Auth couldn't check
 * its sign-in. A remote read is sent to the diagnostic page; any other call gets a 503 error result
 * with the fix, and its function never runs. `page` is the caller's page.
 */
export function syntax_auth_remote_failure_response(
	request: Request,
	failure: SyntaxAuthFailure,
	page: URL
): Response {
	if (!is_remote_read(request)) {
		return remote_error_response(503, {
			message: syntax_auth_failure_message('session', failure)
		});
	}

	return as_remote_request_response(
		new Response(null, {
			status: 302,
			headers: { Location: syntax_auth_diagnostic_location(failure, page) }
		})
	);
}

export function append_set_cookie_headers(
	response: Response,
	set_cookie_headers: string[]
): Response {
	if (set_cookie_headers.length === 0) {
		return response;
	}

	const headers = new Headers(response.headers);
	for (const set_cookie_header of set_cookie_headers) {
		headers.append('Set-Cookie', set_cookie_header);
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}

/**
 * Development: the browser origin of a sign-out POST, or null if it isn't this site's own page.
 * SvelteKit skips its cross-site form check in development, so this is the CSRF check. The Origin
 * must be exactly one of this address's own origins (see get_own_origins), and Sec-Fetch-Site, when
 * the browser sends it, must be `same-origin`.
 */
export function get_development_sign_out_origin(request: Request, app_url: URL): string | null {
	const origin = request.headers.get('origin');
	if (!origin || !get_own_origins(app_url).includes(origin)) {
		return null;
	}

	const site = request.headers.get('sec-fetch-site');
	return site === null || site === 'same-origin' ? origin : null;
}

async function sign_out_development(request: Request, app_url: URL): Promise<Response> {
	const browser_origin = get_development_sign_out_origin(request, app_url);
	if (!browser_origin) {
		return new Response('Cross-site sign-out is forbidden', {
			status: 403,
			headers: { 'Cache-Control': 'no-store' }
		});
	}

	const cookie_header = request.headers.get('cookie');
	const deadline = start_deadline();
	let auth_response: Response;
	try {
		// Platform fetch, as in get_development_syntax_auth, so the Cookie header arrives exactly. The
		// checked origin goes in the private header too, so local Syntax Auth trusts it (it otherwise
		// trusts only localhost) and clears the cookies for its scheme.
		const origin_headers = {
			'Cache-Control': 'no-store',
			Origin: browser_origin,
			[DEVELOPMENT_ORIGIN_HEADER]: browser_origin
		};
		auth_response = await before_deadline(
			fetch(SYNTAX_SIGN_OUT_URL, {
				method: 'POST',
				headers: cookie_header ? { ...origin_headers, Cookie: cookie_header } : origin_headers,
				cache: 'no-store',
				redirect: 'manual',
				signal: deadline.signal
			}),
			deadline.signal
		);
	} catch {
		const failure: SyntaxAuthFailure = {
			kind: deadline.signal.aborted ? 'timeout' : 'unreachable'
		};
		log_syntax_auth_failure('sign_out', failure);
		return syntax_auth_failure_response(request, 'sign_out', failure);
	} finally {
		deadline.clear();
	}

	discard_body(auth_response);
	const set_cookie_headers = get_set_cookie_headers(auth_response);
	if (!auth_response.ok) {
		const failure: SyntaxAuthFailure = { kind: 'status', status: auth_response.status };
		log_syntax_auth_failure('sign_out', failure);
		return append_set_cookie_headers(
			syntax_auth_failure_response(request, 'sign_out', failure),
			set_cookie_headers
		);
	}

	return append_set_cookie_headers(
		new Response(null, { status: 303, headers: { 'Cache-Control': 'no-store', Location: '/' } }),
		set_cookie_headers
	);
}

/**
 * Signs the browser out centrally and forwards every cookie clear. `app_url` is the request URL. In
 * production SvelteKit has already rejected cross-site form posts.
 */
export async function sign_out_syntax_auth(
	request: Request,
	app_url: URL,
	server_fetch: ServerFetch
): Promise<Response> {
	if (dev) {
		return sign_out_development(request, app_url);
	}

	const cookie_header = request.headers.get('cookie');
	const app_origin = new URL(app_url.origin);
	if (!is_trusted_syntax_url(app_origin)) {
		return new Response('Invalid application origin', { status: 400 });
	}

	let auth_response: Response;
	try {
		auth_response = await server_fetch(SYNTAX_SIGN_OUT_URL, {
			method: 'POST',
			headers: {
				'Cache-Control': 'no-store',
				Cookie: cookie_header ?? '',
				Origin: app_origin.origin
			},
			cache: 'no-store'
		});
	} catch {
		console.error('Syntax Auth sign-out request failed');
		return new Response('Unable to sign out', { status: 502 });
	}

	const response = auth_response.ok
		? new Response(null, {
				status: 303,
				headers: { Location: app_origin.origin }
			})
		: new Response('Unable to sign out', { status: 502 });

	return append_set_cookie_headers(response, get_set_cookie_headers(auth_response));
}
