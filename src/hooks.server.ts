// * Server Side Middleware
// https://kit.svelte.dev/docs/hooks

import * as Sentry from '@sentry/sveltekit';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { form_data } from 'sk-form-data';
import { find_user_by_access_token } from './server/auth/users';
import { dev } from '$app/environment';
import { UPSPLASH_TOKEN, UPSPLASH_URL } from '$env/static/private';
import { Redis } from '@upstash/redis';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { transport } from './lib/mcp';

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

// import { ADMIN_LOGIN } from '$env/static/private';

// * START UP
// RUNS ONCE ON FILE LOAD

Sentry.init({
	release: `syntax@${__VER__}`,
	dsn: 'https://ea134756b8f244ff99638864ce038567@o4505358925561856.ingest.sentry.io/4505358945419264',
	tracesSampleRate: 1,
	profilesSampleRate: 1.0, // Profiling sample rate is relative to tracesSampleRate
	environment: dev ? 'development' : 'production',
	integrations: [
		nodeProfilingIntegration,
		Sentry.prismaIntegration(),
		Sentry.redisIntegration({ cachePrefixes: ['show:', 'shows:', 'show-og:'] })
	],
	_experiments: {
		metricsAggregator: true
	}
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

export const mcp: Handle = async function ({ event, resolve }) {
	const mcp_response = await transport.respond(event.request);
	// we are deploying on vercel the SSE connection will timeout after 5 minutes...for
	// the moment we are not sending back any notifications (logs, or list changed notifications)
	// so it's a waste of resources to keep a connection open that will error
	// after 5 minutes making the logs dirty. For this reason if we have a response from
	// the MCP server and it's a GET request we just return an empty response (it has to be
	// 200 or the MCP client will complain)
	if (mcp_response && event.request.method === 'GET') {
		try {
			await mcp_response.body?.cancel();
		} catch {
			// ignore
		}
		return new Response('', { status: 200 });
	}
	return mcp_response ?? resolve(event);
};

// * END HOOKS

// Wraps requests in this sequence of hooks
export const handle: Handle = sequence(
	Sentry.sentryHandle(),
	prisma,
	auth,
	admin,
	safe_form_data,
	document_policy,
	mcp
);

export const handleError = Sentry.handleErrorWithSentry();
