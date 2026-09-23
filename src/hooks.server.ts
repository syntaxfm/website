// * Server Side Middleware
// https://kit.svelte.dev/docs/hooks

import * as Sentry from '@sentry/sveltekit';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { form_data } from 'sk-form-data';

import { dev } from '$app/environment';

import { get_admin_guard_response, get_authenticated_user } from '$server/auth/authorization';
import { append_set_cookie_headers, get_syntax_auth } from '$server/auth/syntax_auth';

// import { ADMIN_LOGIN } from '$env/static/private';

// * START UP
// RUNS ONCE ON FILE LOAD

Sentry.init({
	release: `syntax@${APP_VERSION}`,
	dsn: 'https://ea134756b8f244ff99638864ce038567@o4505358925561856.ingest.sentry.io/4505358945419264',
	tracesSampleRate: 1,
	profilesSampleRate: 1.0, // Profiling sample rate is relative to tracesSampleRate
	environment: dev ? 'development' : 'production',
	integrations: [
		nodeProfilingIntegration,
		Sentry.redisIntegration({ cachePrefixes: ['show:', 'shows:', 'show-og:'] })
	],
	_experiments: {
		metricsAggregator: true
	}
});

// * END START UP

// * HOOKS
// RUNS ON EVERY REQUEST

const auth: Handle = async function ({ event, resolve }) {
	event.locals.theme = decodeURIComponent(event.cookies.get('theme') || 'system');
	event.locals.user = null;
	event.locals.auth_session = null;

	let set_cookie_headers: string[] = [];
	if (event.url.pathname !== '/logout') {
		const auth_result = await get_syntax_auth(event.request.headers.get('cookie'), event.fetch);
		set_cookie_headers = auth_result.set_cookie_headers;

		if (auth_result.auth) {
			event.locals.user = await get_authenticated_user(auth_result.auth.user);
			event.locals.auth_session = auth_result.auth.session;
		}
	}

	if (event.route.id?.startsWith('/(site)/admin')) {
		const guard_response = get_admin_guard_response(event.locals.user, event.url);
		if (guard_response) {
			return append_set_cookie_headers(guard_response, set_cookie_headers);
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
	Sentry.sentryHandle(),
	request_metadata,
	auth,
	safe_form_data,
	document_policy
);

// SvelteKit requires this hook export to be named `handleError` (camelCase).
// eslint-disable-next-line @typescript-eslint/naming-convention
export const handleError = Sentry.handleErrorWithSentry();
