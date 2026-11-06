// * Server Side Middleware
// https://kit.svelte.dev/docs/hooks

import * as Sentry from '@sentry/sveltekit';
import { sequence, type Handle } from '@sveltejs/kit/hooks';
import { form_data } from 'sk-form-data';

import { dev } from '$app/env';
import { PUBLIC_URL } from '$app/env/public';
import { PRODUCTION_HOST } from '$const';
import { server_timing_header } from '$server/server_timing';

import {
	get_admin_guard_response,
	get_admin_remote_guard_response
} from '$server/auth/authorization';
import { get_request_auth, get_request_auth_cookies } from '$server/auth/request_auth';
import {
	append_set_cookie_headers,
	as_data_request_response,
	syntax_auth_remote_failure_response
} from '$server/auth/syntax_auth';
import {
	syntax_auth_diagnostic_response,
	syntax_auth_failure_response
} from '$server/auth/syntax_auth_failure';

// import { ADMIN_LOGIN } from '$env/static/private';

// * START UP
// Sentry on Cloudflare Workers: the SDK starts per request inside this handle (Node's Sentry.init,
// profiling and the Redis integration don't run in a Worker). It must be the first handle.
const sentry_init = Sentry.initCloudflareSentryHandle({
	release: `syntax@${APP_VERSION}`,
	dsn: 'https://ea134756b8f244ff99638864ce038567@o4505358925561856.ingest.sentry.io/4505358945419264',
	tracesSampleRate: 1,
	environment: dev ? 'development' : 'production'
});

// * END START UP

// * HOOKS
// RUNS ON EVERY REQUEST

// Syntax Auth is asked only when code needs the user (server/auth/request_auth.ts): up front for
// pages that send signed-out visitors to sign in, and on demand everywhere else. Public pages and
// remote functions never ask, so they don't pay the round trip.
const auth: Handle = async function ({ event, resolve }) {
	// Development: the page a remote call is sent to when Syntax Auth is down, rendered without
	// asking Auth. Matched on the URL the browser requested, never a remote call's claimed page.
	const diagnostic_response = dev ? syntax_auth_diagnostic_response(event.request) : null;
	if (diagnostic_response) return diagnostic_response;

	// Admin remote queries carry no page, so their route is null here; they check with
	// assert_admin(). Commands and forms carry the admin page that called them.
	const is_admin_route = event.route.id?.startsWith('/(site)/admin') ?? false;
	// Pages that send a signed-out visitor to sign in. In development they ask local Syntax Auth even
	// without a cookie, so a stopped Auth shows its fix rather than a sign-in that can't work.
	const requires_sign_in = is_admin_route || event.url.pathname === '/login';

	if (requires_sign_in) {
		const { user, failure, set_cookie_headers } = await get_request_auth(event, {
			required: true
		});

		// Only development reports failures; production treats them as signed out. A remote call
		// can't show a page: a read is sent to the diagnostic page, anything else gets the fix as
		// its error, and nothing runs or is retried.
		if (failure) {
			const failure_response = event.isRemoteRequest
				? syntax_auth_remote_failure_response(event.request, failure, event.url)
				: syntax_auth_failure_response(event.request, 'session', failure);
			return append_set_cookie_headers(failure_response, set_cookie_headers);
		}

		if (is_admin_route) {
			// Each answered as its client-side request expects it in development (see syntax_auth.ts).
			const guard_response = event.isRemoteRequest
				? get_admin_remote_guard_response(user, event.url, event.request)
				: get_admin_guard_response(user, event.url);
			if (guard_response) {
				const response = event.isDataRequest
					? as_data_request_response(guard_response)
					: guard_response;
				return append_set_cookie_headers(response, set_cookie_headers);
			}
		}
	}

	const response = await resolve(event);
	return append_set_cookie_headers(response, await get_request_auth_cookies(event));
};

const request_metadata: Handle = async function ({ event, resolve }) {
	event.locals.request_metadata = {
		ip: event.request.headers.get('x-forwarded-for'),
		country: event.request.headers.get('x-vercel-ip-country')
	};
	return resolve(event);
};

const document_policy: Handle = async function ({ event, resolve }) {
	const response = await resolve(event);
	response.headers.set('Document-Policy', 'js-profiling');
	return response;
};

// SvelteKit preloads JS and CSS by default. Adding fonts puts a <link rel="preload"> for the site
// font in the HTML head, so it downloads alongside the CSS instead of after it is parsed.
const preload_fonts: Handle = async function ({ event, resolve }) {
	return resolve(event, {
		preload: ({ type }) => type === 'js' || type === 'css' || type === 'font'
	});
};

// Where each request's server time went, for DevTools' Timing tab (see server_timing.ts)
const server_timing: Handle = async function ({ event, resolve }) {
	const start = performance.now();
	const response = await resolve(event);
	try {
		response.headers.append(
			'server-timing',
			server_timing_header(event, performance.now() - start)
		);
	} catch {
		// Responses passed through from fetch() have immutable headers; they go without
	}
	return response;
};

// Pages render the same for every visitor (the user and theme are browser only), so pages and page
// data are cached at Cloudflare's edge for PAGE_CACHE_SECONDS; browsers check back each time. The
// Worker's cache keys by URL only, so anything per visitor stays private: admin, sign in/out,
// responses that set a cookie, and routes that set their own cache-control (an admin's preview of
// an unreleased show). Each deploy purges the page cache (scripts/purge-beta-cache.ts), so a cached
// page never names a previous build's files.
const PAGE_CACHE_SECONDS = 60 * 5;
const PRIVATE_ROUTE_PREFIXES = ['/(site)/admin', '/(site)/login'];
// Sentry's per-request trace tags would make every visitor of a cached page share one trace
const SENTRY_TRACE_TAGS = /<meta name="(?:sentry-trace|baggage)"[^>]*>/g;

const page_cache: Handle = async function ({ event, resolve }) {
	const response = await resolve(event);
	const is_page = response.headers.get('x-sveltekit-page') === 'true';
	if (!is_page && !event.isDataRequest) return response;

	const is_private =
		event.url.pathname === '/logout' ||
		PRIVATE_ROUTE_PREFIXES.some((prefix) => event.route.id?.startsWith(prefix)) ||
		response.headers.has('set-cookie');
	if (is_private) {
		response.headers.set('cache-control', 'private, no-cache');
		return response;
	}
	if (response.status !== 200 || response.headers.has('cache-control')) return response;

	response.headers.set('cache-control', `public, max-age=0, s-maxage=${PAGE_CACHE_SECONDS}`);
	if (!is_page) return response;

	const html = (await response.text()).replace(SENTRY_TRACE_TAGS, '');
	// The body changed, so its length and ETag no longer describe it
	response.headers.delete('content-length');
	response.headers.delete('etag');
	return new Response(html, { status: response.status, headers: response.headers });
};

// Plausible, proxied through /api/57475. Only the live site counts, so betas and previews don't
// mix into syntax.fm's stats. Fills the %syntax.analytics% placeholder in app.html.
const ANALYTICS_SCRIPT =
	'<script defer data-domain="syntax.fm" data-api="/api/57475/3v3n7" src="/api/57475/script.js"></script>';
const analytics: Handle = async function ({ event, resolve }) {
	const script = PUBLIC_URL === PRODUCTION_HOST ? ANALYTICS_SCRIPT : '';
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%syntax.analytics%', script)
	});
};

const safe_paths = new Set(['/api/errors', '/api/57475/3v3n7']);
const safe_form_data: Handle = async function ({ event, resolve }) {
	if (safe_paths.has(event.url.pathname)) return resolve(event);
	try {
		const result = await form_data({ event, resolve });
		return result;
	} catch (error) {
		console.error('Error parsing form-data:');
		console.error(error);
	}
	return resolve(event);
};

// * END HOOKS

// Wraps requests in this sequence of hooks
export const handle: Handle = sequence(
	sentry_init,
	Sentry.sentryHandle(),
	server_timing,
	page_cache,
	request_metadata,
	auth,
	safe_form_data,
	document_policy,
	preload_fonts,
	analytics
);

// SvelteKit requires this hook export to be named `handleError` (camelCase).
// eslint-disable-next-line @typescript-eslint/naming-convention
export const handleError = Sentry.handleErrorWithSentry();
