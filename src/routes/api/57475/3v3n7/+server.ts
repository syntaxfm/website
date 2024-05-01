import * as Sentry from '@sentry/sveltekit';
import type { RequestHandler } from '@sveltejs/kit';
import optionsHandler from '../../optionsHandler';

export const OPTIONS = optionsHandler();

export const POST: RequestHandler = async ({ request, locals }) => {
	// 1. Make a copy of the headers so we can modify them. This is necessary because the headers are immutable.
	const headers = new Headers(request.headers);
	// 2. Delete any cookies - we dont need them
	headers.delete('cookie');
	// 3. Set the IP address of the client. Because we use cloudflare, we need to get the IP address from the headers
	const ip =
		request.headers.get('true-client-ip') || // Cloudflare
		request.headers.get('x-forwarded-for') || // Common Proxy / Load Balancer (Vercel included)
		locals.session.ip; // Svelte backup, probably just x-forwarded-for
	// Logging for testing, delete for production
	console.log('IP:', ip, {
		trueClientIp: request.headers.get('true-client-ip'),
		xForwardedFor: request.headers.get('x-forwarded-for')
	});
	// const headers = req.headers;
	headers.set('X-Forwarded-For', ip);
	// Recreate the request with the new headers, we have to do it this way because the headers are immutable
	return fetch('https://plausible.io/api/event', {
		body: request.body,
		duplex: 'half',
		cache: request.cache,
		credentials: request.credentials,
		headers,
		integrity: request.integrity,
		keepalive: request.keepalive,
		method: request.method,
		mode: request.mode,
		redirect: request.redirect,
		referrer: request.referrer,
		referrerPolicy: request.referrerPolicy,
		signal: request.signal
	});

	const body = await request.text();
	const response = await fetch('https://plausible.io/api/event', {
		method: 'POST',
		body,
		headers: {
			'User-Agent': request.headers.get('user-agent') || 'unknown',
			'Content-Type': 'application/json',
			'X-Forwarded-For': locals.session.ip
		}
	});
	const responseBody = await response.text();
	if (!response.ok) {
		const message = `Error proxying plausible event: ${JSON.stringify(
			{
				status: response.status,
				statusText: response.statusText,
				headers: [...response.headers.entries()],
				body: responseBody
			},
			null,
			2
		)}`;
		console.error(message);
		const errorId = crypto.randomUUID();
		Sentry.captureException(new Error(message), {
			extra: { event, errorId, status: response.status }
		});
	}
	return new Response(responseBody, {
		status: response.status,
		statusText: response.statusText,
		headers: {
			'Content-Type': response.headers.get('content-type') || 'text/plain'
		}
	});
};
