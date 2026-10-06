// Development-only answers for when local Syntax Auth can't be used. Every word is fixed here: no
// error message, stack, cookie, token, or Auth response body ever reaches the page, JSON, or logs.

export type SyntaxAuthFailure =
	| { kind: 'unreachable' }
	| { kind: 'timeout' }
	| { kind: 'status'; status: number }
	| { kind: 'invalid_response' };

export type SyntaxAuthOperation = 'session' | 'sign_out';

export const SYNTAX_AUTH_RESTART_COMMAND = 'pnpm dev';

const TITLES: Record<SyntaxAuthOperation, string> = {
	session: 'Syntax Auth couldn’t check your sign-in',
	sign_out: 'Syntax Auth couldn’t sign you out'
};

const FIX =
	'Make sure Docker Desktop (or OrbStack) is running, then stop this dev server and start it ' +
	`again with ${SYNTAX_AUTH_RESTART_COMMAND}. Starting it starts local Syntax Auth and prints ` +
	'any problem that remains.';

export function describe_syntax_auth_failure(failure: SyntaxAuthFailure): string {
	switch (failure.kind) {
		case 'unreachable':
			return 'Local Syntax Auth isn’t answering at http://localhost:37960.';
		case 'timeout':
			return 'Local Syntax Auth didn’t answer within 5 seconds.';
		case 'status':
			return `Local Syntax Auth answered with HTTP status ${Math.trunc(failure.status)}.`;
		case 'invalid_response':
			return 'Local Syntax Auth answered with a response this site couldn’t read.';
	}
}

export function log_syntax_auth_failure(
	operation: SyntaxAuthOperation,
	failure: SyntaxAuthFailure
): void {
	console.error(`${TITLES[operation]}: ${describe_syntax_auth_failure(failure)}`);
}

function wants_html(request: Request): boolean {
	return request.headers.get('accept')?.includes('text/html') ?? false;
}

function escape_html(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function render_page(title: string, problem: string, return_to?: string): string {
	const back = return_to
		? `<p><a href="${escape_html(return_to)}">Back to the page you were on</a></p>\n`
		: '';
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>
:root { color-scheme: light dark; font-family: system-ui, sans-serif; line-height: 1.5; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 1.5rem;
	box-sizing: border-box; background: Canvas; color: CanvasText; }
main { max-width: 36rem; width: 100%; border-top: 0.5rem solid #fabf47; padding-top: 1rem; }
h1 { font-size: 1.5rem; line-height: 1.2; margin: 0 0 1rem; overflow-wrap: anywhere; }
h2 { font-size: 1rem; margin: 0 0 0.5rem; }
p { margin: 0 0 1rem; overflow-wrap: anywhere; }
pre { margin: 0 0 1rem; padding: 0.75rem 1rem; border-radius: 0.5rem; overflow-x: auto;
	background: color-mix(in srgb, CanvasText 10%, Canvas); }
code { font-family: ui-monospace, monospace; font-size: 1rem; }
</style>
</head>
<body>
<main>
<h1>${title}</h1>
<p>${problem}</p>
<h2>Fix</h2>
<p>${FIX}</p>
<pre><code>${SYNTAX_AUTH_RESTART_COMMAND}</code></pre>
${back}</main>
</body>
</html>
`;
}

/** The fixed one-line problem and fix, for answers that carry only a message. */
export function syntax_auth_failure_message(
	operation: SyntaxAuthOperation,
	failure: SyntaxAuthFailure
): string {
	return `${TITLES[operation]}. ${describe_syntax_auth_failure(failure)} ${FIX}`;
}

/**
 * A development 503 page, or JSON for scripts and SvelteKit data requests. Never cached. A client-side
 * navigation shows only the JSON's `message` (src/routes/+error.svelte), so it carries the fix too.
 */
export function syntax_auth_failure_response(
	request: Request,
	operation: SyntaxAuthOperation,
	failure: SyntaxAuthFailure
): Response {
	const title = TITLES[operation];
	const problem = describe_syntax_auth_failure(failure);
	const headers = { 'Cache-Control': 'no-store' };

	if (wants_html(request)) {
		return new Response(render_page(title, problem), {
			status: 503,
			headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' }
		});
	}

	return Response.json(
		{
			error: 'syntax_auth_unavailable',
			message: syntax_auth_failure_message(operation, failure),
			fix: FIX
		},
		{ status: 503, headers }
	);
}

// The development page a remote query (a GET) is sent to when Syntax Auth can't check its sign-in.
// SvelteKit's client can only navigate on a remote query's answer, so the hook answers with a
// redirect here (syntax_auth_remote_failure_response in syntax_auth.ts), and the browser loads it as a document
// because no route claims it in development (src/params/app_path.ts). The hook renders it without
// asking Syntax Auth, from a fixed reason and a checked app-relative return, never from free text.
export const SYNTAX_AUTH_DIAGNOSTIC_PATH = '/__syntax_auth_unavailable';
// The sign-in gateway's mount (DEVELOPMENT_AUTH_MOUNT_PATH in syntax_auth.ts).
const AUTH_MOUNT_PATH = '/__syntax_auth';
// Resolves a return path to check that it stays on the page's own origin.
const RETURN_BASE = 'http://app.invalid';
const MAX_RETURN_LENGTH = 2048;

const REASONS = ['unreachable', 'timeout', 'status', 'invalid_response'] as const;
type Reason = (typeof REASONS)[number];

function is_reason(value: string): value is Reason {
	return REASONS.some((reason) => reason === value);
}

function is_reserved_path(pathname: string): boolean {
	return [AUTH_MOUNT_PATH, SYNTAX_AUTH_DIAGNOSTIC_PATH].some(
		(reserved) => pathname === reserved || pathname.startsWith(`${reserved}/`)
	);
}

/**
 * `value` if it is an app-relative path and query, written exactly as a URL writes it (so it holds
 * no space, quote, angle bracket, backslash, or fragment), off the sign-in gateway and this page.
 */
function checked_return(value: string): string | null {
	if (
		value.length > MAX_RETURN_LENGTH ||
		!value.startsWith('/') ||
		value.startsWith('//') ||
		!/^[\x21-\x7e]+$/.test(value) ||
		value.includes('\\')
	) {
		return null;
	}

	let url: URL;
	try {
		url = new URL(value, RETURN_BASE);
	} catch {
		return null;
	}

	const is_same = url.origin === RETURN_BASE && `${url.pathname}${url.search}` === value;
	return is_same && !is_reserved_path(url.pathname) ? value : null;
}

/** Where to send a development remote call whose sign-in check failed; `page` is the caller's page. */
export function syntax_auth_diagnostic_location(failure: SyntaxAuthFailure, page: URL): string {
	const query = new URLSearchParams({ reason: failure.kind });
	if (failure.kind === 'status') query.set('status', String(Math.trunc(failure.status)));
	query.set('return_to', checked_return(`${page.pathname}${page.search}`) ?? '/');
	return `${SYNTAX_AUTH_DIAGNOSTIC_PATH}?${query}`;
}

function parse_failure(query: URLSearchParams): SyntaxAuthFailure | null {
	const reason = query.get('reason') ?? '';
	if (!is_reason(reason)) return null;
	if (reason !== 'status') return { kind: reason };

	const status = query.get('status') ?? '';
	return /^[1-5][0-9]{2}$/.test(status) ? { kind: 'status', status: Number(status) } : null;
}

function parse_diagnostic(
	query: URLSearchParams
): { failure: SyntaxAuthFailure; return_to: string } | null {
	const names = [...query.keys()];
	const failure = parse_failure(query);
	const expected =
		failure?.kind === 'status' ? ['reason', 'return_to', 'status'] : ['reason', 'return_to'];
	if (
		!failure ||
		names.length !== expected.length ||
		!expected.every((name) => names.includes(name))
	) {
		return null;
	}

	const return_to = checked_return(query.get('return_to') ?? '');
	return return_to ? { failure, return_to } : null;
}

/**
 * Development: the diagnostic page for a GET of SYNTAX_AUTH_DIAGNOSTIC_PATH, a fixed 400 for a link
 * that fails the checks, or null for any other request, which goes on as usual.
 */
export function syntax_auth_diagnostic_response(request: Request): Response | null {
	const url = new URL(request.url);
	if (request.method !== 'GET' || url.pathname !== SYNTAX_AUTH_DIAGNOSTIC_PATH) return null;

	const diagnostic = parse_diagnostic(url.searchParams);
	if (!diagnostic) {
		return new Response('This Syntax Auth diagnostic link isn’t valid.', {
			status: 400,
			headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' }
		});
	}

	const page = render_page(
		TITLES.session,
		describe_syntax_auth_failure(diagnostic.failure),
		diagnostic.return_to
	);
	return new Response(page, {
		status: 503,
		headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/html; charset=utf-8' }
	});
}
