// * Server Side Middleware
// https://kit.svelte.dev/docs/hooks

import * as Sentry from '@sentry/sveltekit';
import { sequence, type Handle } from '@sveltejs/kit/hooks';
import { form_data } from 'sk-form-data';

import { dev } from '$app/env';
import { PUBLIC_URL } from '$app/env/public';
import { PRODUCTION_HOST } from '$const';

import {
	get_admin_guard_response,
	get_admin_remote_guard_response,
	get_authenticated_user
} from '$server/auth/authorization';
import {
	append_set_cookie_headers,
	as_data_request_response,
	get_syntax_auth,
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

const auth: Handle = async function ({ event, resolve }) {
	event.locals.theme = decodeURIComponent(event.cookies.get('theme') || 'system');
	event.locals.user = null;
	event.locals.auth_session = null;

	// Development: the page a remote call is sent to when Syntax Auth is down, rendered without
	// asking Auth. Matched on the URL the browser requested, never a remote call's claimed page.
	const diagnostic_response = dev ? syntax_auth_diagnostic_response(event.request) : null;
	if (diagnostic_response) return diagnostic_response;

	const is_admin_route = event.route.id?.startsWith('/(site)/admin') ?? false;
	// Pages that send a signed-out visitor to sign in. In development they ask local Syntax Auth even
	// without a cookie, so a stopped Auth shows its fix rather than a sign-in that can't work.
	const requires_sign_in = is_admin_route || event.url.pathname === '/login';

	let set_cookie_headers: string[] = [];
	if (event.url.pathname !== '/logout') {
		const auth_result = await get_syntax_auth(event.request.headers.get('cookie'), event.fetch, {
			required: requires_sign_in
		});
		set_cookie_headers = auth_result.set_cookie_headers;

		// Only development reports failures; production treats them as signed out. A remote call
		// can't show a page: a read is sent to the diagnostic page, anything else gets the fix as
		// its error, and nothing runs or is retried.
		if (auth_result.failure && requires_sign_in) {
			const failure_response = event.isRemoteRequest
				? syntax_auth_remote_failure_response(event.request, auth_result.failure, event.url)
				: syntax_auth_failure_response(event.request, 'session', auth_result.failure);
			return append_set_cookie_headers(failure_response, set_cookie_headers);
		}

		if (auth_result.auth) {
			event.locals.user = await get_authenticated_user(auth_result.auth.user);
			event.locals.auth_session = auth_result.auth.session;
		}
	}

	if (is_admin_route) {
		// Each answered as its client-side request expects it in development (see syntax_auth.ts).
		const guard_response = event.isRemoteRequest
			? get_admin_remote_guard_response(event.locals.user, event.url, event.request)
			: get_admin_guard_response(event.locals.user, event.url);
		if (guard_response) {
			const response = event.isDataRequest
				? as_data_request_response(guard_response)
				: guard_response;
			return append_set_cookie_headers(response, set_cookie_headers);
		}
	}

	return append_set_cookie_headers(await resolve(event), set_cookie_headers);
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
