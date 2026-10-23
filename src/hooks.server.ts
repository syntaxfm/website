// * Server Side Middleware
// https://svelte.dev/docs/kit/hooks

import * as Sentry from '@sentry/sveltekit';
import { redirect } from '@sveltejs/kit';
import { sequence, type Handle } from '@sveltejs/kit/hooks';
import { form_data } from 'sk-form-data';
import { find_user_by_access_token } from './server/auth/users';
import { building, dev } from '$app/env';
import { UPSPLASH_TOKEN, UPSPLASH_URL } from '$app/env/private';
import { Redis } from '@upstash/redis';

export const cache_status = UPSPLASH_URL && UPSPLASH_TOKEN ? 'ONLINE' : 'OFFLINE';

export const redis =
	cache_status == 'ONLINE'
		? new Redis({
				url: UPSPLASH_URL,
				token: UPSPLASH_TOKEN,
				automaticDeserialization: false
			})
		: null;
console.log(`🤓 Cache Status... ${cache_status}`);

// import { ADMIN_LOGIN } from '$app/env/private';

// * START UP
// RUNS ONCE ON FILE LOAD

// Loading the native profiler inside SvelteKit's build analysis worker segfaults when the worker exits
const profiling_integrations = building
	? []
	: [(await import('@sentry/profiling-node')).nodeProfilingIntegration()];

Sentry.init({
	release: `syntax@${__VER__}`,
	dsn: 'https://ea134756b8f244ff99638864ce038567@o4505358925561856.ingest.sentry.io/4505358945419264',
	tracesSampleRate: 1,
	profileSessionSampleRate: 1.0,
	profileLifecycle: 'trace',
	environment: dev ? 'development' : 'production',
	integrations: [
		...profiling_integrations,
		Sentry.prismaIntegration(),
		Sentry.redisIntegration({ cachePrefixes: ['show:', 'shows:', 'show-og:'] })
	]
});

// * END START UP

// * HOOKS
// RUNS ON EVERY REQUEST

export const auth: Handle = async function ({ event, resolve }) {
	const access_token = event.cookies.get('access_token');
	event.locals.theme = decodeURIComponent(event.cookies.get('theme') || 'system');
	// Get current user from session via access token
	if (access_token) {
		const user = await find_user_by_access_token(access_token);
		if (user) {
			event.locals.user = user;
		}
	}

	const response = await resolve(event);
	return response;
};

export const admin: Handle = async function ({ event, resolve }) {
	if (
		event.route.id?.startsWith('/(site)/admin') &&
		!event.locals?.user?.roles?.includes('admin')
	) {
		throw redirect(302, '/login');
	}
	return resolve(event);
};

// This hook is used to pass our prisma instance to each action, load, and endpoint
export const prisma: Handle = async function ({ event, resolve }) {
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

export const document_policy: Handle = async function ({ event, resolve }) {
	const response = await resolve(event);
	response.headers.set('Document-Policy', 'js-profiling');
	return response;
};

const safe_paths = new Set(['/api/errors', '/api/57475/3v3n7']);
export const safe_form_data: Handle = async function ({ event, resolve }) {
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
	prisma,
	auth,
	admin,
	safe_form_data,
	document_policy
);

// eslint-disable-next-line @typescript-eslint/naming-convention
export const handleError = Sentry.handleErrorWithSentry();
