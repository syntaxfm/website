// * Server Side Middleware
// https://kit.svelte.dev/docs/hooks

import * as Sentry from '@sentry/sveltekit';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { form_data } from 'sk-form-data';
import { find_first_admin_user, find_user_by_access_token } from './server/auth/users';
import type { UserWithRoles } from './server/auth/users';
import { dev } from '$app/environment';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

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

// Dev-only: resolve a real admin user once per process so /admin (and its remote
// functions) are reachable locally without completing GitHub OAuth. Inert in prod
// builds because `dev` is statically false and this branch is tree-shaken out.
let dev_admin_promise: Promise<UserWithRoles | null> | null = null;

const auth: Handle = async function ({ event, resolve }) {
	const access_token = event.cookies.get('access_token');
	event.locals.theme = decodeURIComponent(event.cookies.get('theme') || 'system');
	// Get current user from session via access token
	if (access_token) {
		const user = await find_user_by_access_token(access_token);
		if (user) {
			event.locals.user = user;
		}
	}

	if (dev && !event.locals.user) {
		dev_admin_promise ??= find_first_admin_user();
		const dev_admin = await dev_admin_promise;
		if (dev_admin) {
			event.locals.user = dev_admin;
		}
	}

	const response = await resolve(event);
	return response;
};

const admin: Handle = async function ({ event, resolve }) {
	if (
		event.route.id?.startsWith('/(site)/admin') &&
		!event.locals?.user?.roles?.includes('admin')
	) {
		throw redirect(302, '/login');
	}
	return resolve(event);
};

// This hook is used to pass our  instance to each action, load, and endpoint
const headers: Handle = async function ({ event, resolve }) {
	const ip = event.request.headers.get('x-forwarded-for') as string;
	const country = event.request.headers.get('x-vercel-ip-country') as string;
	event.locals.session = {
		...event.locals.session,
		ip,
		country
	};
	const response = await resolve(event);
	return response;
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
	headers,
	auth,
	admin,
	safe_form_data,
	document_policy
);

// SvelteKit requires this hook export to be named `handleError` (camelCase).
// eslint-disable-next-line @typescript-eslint/naming-convention
export const handleError = Sentry.handleErrorWithSentry();
