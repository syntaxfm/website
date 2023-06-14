import * as Sentry from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';
import { form_data } from 'sk-form-data';
import { PrismaClient } from '@prisma/client';
import type { Handle } from '@sveltejs/kit';
import { find_user_by_access_token } from '$db/auth/users';

Sentry.init({
	dsn: 'https://ea134756b8f244ff99638864ce038567@o4505358925561856.ingest.sentry.io/4505358945419264',
	tracesSampleRate: 1
});

// import { ADMIN_LOGIN } from '$env/static/private';

// * START UP
// RUNS ONCE ON FILE LOAD
export const prisma_client = new PrismaClient();

// * END START UP

// * HOOKS
// RUNS ON EVERY REQUEST

export const auth: Handle = async function ({ event, resolve }) {
	const access_token = event.cookies.get('access_token');
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

// * END HOOKS

// Wraps requests in this sequence of hooks
export const handle: Handle = sequence(Sentry.sentryHandle(), sequence(prisma, auth, form_data));
export const handleError = Sentry.handleErrorWithSentry();