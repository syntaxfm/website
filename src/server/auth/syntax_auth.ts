import { dev } from '$app/environment';

// Dev uses the shared local Syntax Auth (@syntaxfm/auth-local). Production is fixed in code so no
// environment setting can point it anywhere else.
const SYNTAX_AUTH_ORIGIN = dev ? 'http://localhost:37960' : 'https://auth.syntax.fm';
const SYNTAX_SESSION_URL = `${SYNTAX_AUTH_ORIGIN}/api/auth/get-session`;
const SYNTAX_SIGN_OUT_URL = `${SYNTAX_AUTH_ORIGIN}/api/auth/sign-out`;

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

export async function get_syntax_auth(
	cookie_header: string | null,
	server_fetch: ServerFetch
): Promise<SyntaxAuthResult> {
	if (!cookie_header) {
		return { auth: null, set_cookie_headers: [] };
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
	} catch (error) {
		console.error('Syntax Auth session request failed', error);
		return { auth: null, set_cookie_headers: [] };
	}

	const set_cookie_headers = get_set_cookie_headers(response);
	if (!response.ok) {
		return { auth: null, set_cookie_headers };
	}

	try {
		return {
			auth: parse_auth_context(await response.json()),
			set_cookie_headers
		};
	} catch (error) {
		console.error('Syntax Auth returned an invalid session response', error);
		return { auth: null, set_cookie_headers };
	}
}

function is_local_dev_url(url: URL): boolean {
	return url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
}

export function is_trusted_syntax_url(url: URL): boolean {
	if (url.username !== '' || url.password !== '') {
		return false;
	}

	if (dev && is_local_dev_url(url)) {
		return true;
	}

	return (
		url.protocol === 'https:' &&
		(url.hostname === 'syntax.fm' || url.hostname.endsWith('.syntax.fm'))
	);
}

export function build_syntax_sign_in_url(return_to: URL): URL {
	const sign_in_url = new URL('/sign-in', SYNTAX_AUTH_ORIGIN);
	if (is_trusted_syntax_url(return_to)) {
		sign_in_url.searchParams.set('return_to', return_to.href);
	}
	return sign_in_url;
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

export async function sign_out_syntax_auth(
	cookie_header: string | null,
	app_origin: URL,
	server_fetch: ServerFetch
): Promise<Response> {
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
	} catch (error) {
		console.error('Syntax Auth sign-out request failed', error);
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
