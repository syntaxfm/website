// * Server Side Middleware
// https://kit.svelte.dev/docs/hooks

import * as Sentry from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';
import { form_data } from 'sk-form-data';
import { PrismaClient } from '@prisma/client';
import { redirect, type Handle } from '@sveltejs/kit';
import { find_user_by_access_token } from './server/auth/users';
import { dev } from '$app/environment';
import get_show_path from '$utilities/slug';
import { Redis } from '@upstash/redis';
import { UPSPLASH_TOKEN } from '$env/static/private';
// import { ProfilingIntegration } from '@sentry/profiling-node';

export const redis = new Redis({
	url: 'https://usw1-pet-kid-33258.upstash.io',
	token: UPSPLASH_TOKEN
});
// import { ADMIN_LOGIN } from '$env/static/private';

// * START UP
// RUNS ONCE ON FILE LOAD
export const prisma_client = new PrismaClient();

Sentry.init({
	release: `syntax@${__VER__}`,
	dsn: 'https://ea134756b8f244ff99638864ce038567@o4505358925561856.ingest.sentry.io/4505358945419264',
	tracesSampleRate: 1,
	// profilesSampleRate: 1.0, // Profiling sample rate is relative to tracesSampleRate
	environment: dev ? 'development' : 'production',
	integrations: [
		// new ProfilingIntegration(),
		new Sentry.Integrations.Prisma({ client: prisma_client })
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

// This hook is used to pass our prisma instance to each action, load, and endpoint
export const prisma: Handle = async function ({ event, resolve }) {
	const ip = event.request.headers.get('x-forwarded-for') as string;
	const country = event.request.headers.get('x-vercel-ip-country') as string;
	event.locals.prisma = prisma_client;
	event.locals.session = {
		...event.locals.session,
		ip,
		country
	};
	const response = await resolve(event);
	return response;
};

export const redirects: Handle = async function ({ event, resolve }) {
	const { pathname } = event.url;
	const path_parts = pathname.split('/');
	// Not something we care about
	if (path_parts.length > 2) return resolve(event);

	const maybe_show_number = parseInt(path_parts.at(1) || '');
	// Not a number, so not a show, pass it down the middleware chain

	if (isNaN(maybe_show_number)) return resolve(event);
	// Is there a show with this number?
	const show = await prisma_client.show.findUnique({ where: { number: maybe_show_number } });
	// No show found, pass it down the middleware chain - will probably 404, but thats sveltekit's job to figure that out, not ours!
	if (!show) return resolve(event);
	const url = get_show_path(show);
	// Redirect to the page for this show
	throw redirect(302, url);
};

export const document_policy: Handle = async function ({ event, resolve }) {
	const response = await resolve(event);
	response.headers.set('Document-Policy', 'js-profiling');
	return response;
};

// * END HOOKS

// Wraps requests in this sequence of hooks
export const handle: Handle = sequence(
	Sentry.sentryHandle(),
	prisma,
	auth,
	form_data,
	redirects,
	document_policy
);
export const handleError = Sentry.handleErrorWithSentry();
