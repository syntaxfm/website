import { sequence } from '@sveltejs/kit/hooks';
// import * as SentryNode from '@sentry/node';
// import '@sentry/tracing';
import { form_data } from 'sk-form-data';
import { PrismaClient } from '@prisma/client';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { find_user_by_access_token } from '$db/auth/users';
// import { ADMIN_LOGIN } from '$env/static/private';
// import { PUBLIC_SENTRY_DSN } from '$env/static/public';

// * START UP
// RUNS ONCE ON FILE LOAD
export const prisma_client = new PrismaClient();

// * END START UP

// * HOOKS
// RUNS ON EVERY REQUEST

// SentryNode.init({
// 	dsn: PUBLIC_SENTRY_DSN,
// 	tracesSampleRate: 1.0,
// 	// Add the Http integration for tracing
// 	integrations: [new SentryNode.Integrations.Http()]
// });

// SentryNode.setTag('svelteKit', 'server');

// use handleError to report errors during server-side data loading
// export const handleError = (({ error, event }) => {
// 	SentryNode.captureException(error, { contexts: { sveltekit: { event } } });

// 	return {
// 		message: (error as Error).message
// 	};
// }) satisfies HandleServerError;

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
export const handle: Handle = sequence(prisma, auth, form_data);
