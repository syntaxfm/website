import { sequence } from '@sveltejs/kit/hooks';
// import * as SentryNode from '@sentry/node';
// import '@sentry/tracing';
import { form_data } from 'sk-form-data';
// import { PrismaClient } from '@prisma/client';
import type { Handle, HandleServerError } from '@sveltejs/kit';
// import { ADMIN_LOGIN } from '$env/static/private';
// import { PUBLIC_SENTRY_DSN } from '$env/static/public';

// * START
// RUNS ONCE ON FILE LOAD
// const prisma_client = new PrismaClient();

// END START

//
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

// export const auth: Handle = async function ({ event, resolve }) {
// 	const url = new URL(event.request.url);
// 	if (url.pathname.startsWith('/admin')) {
// 		const auth = event.request.headers.get('Authorization');

// 		if (auth !== `Basic ${btoa(ADMIN_LOGIN)}`) {
// 			return new Response('Not authorized', {
// 				status: 401,
// 				headers: {
// 					'WWW-Authenticate': 'Basic realm="User Visible Realm", charset="UTF-8"'
// 				}
// 			});
// 		}
// 	}

// 	const response = await resolve(event);
// 	return response;
// };

// This hook is used to pass our prisma instance to each action, load, and endpoint
// export const prisma: Handle = async function ({ event, resolve }) {
// 	const ip = event.request.headers.get('x-forwarded-for');
// 	if (ip === '159.196.12.240') {
// 		throw new Error('Success');
// 	}
// 	if (event.request.method === 'POST') {
// 		const country = event.request.headers.get('x-vercel-ip-country');
// 		const { headers, body } = event.request;
// 		console.log({ ip, country });
// 	}

// 	event.locals.prisma = prisma_client;
// 	const response = await resolve(event);
// 	return response;
// };

// END HOOKS

// Wraps requests in this sequence of hooks
export const handle: Handle = sequence(form_data);
