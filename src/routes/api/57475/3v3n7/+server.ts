import * as Sentry from '@sentry/sveltekit';
import type { RequestHandler } from '@sveltejs/kit';
import optionsHandler from '../../optionsHandler';

export const OPTIONS = optionsHandler();

function get_client_ip(request: Request) {
	const headerIPs = [
		'true-client-ip', // Cloudflare
		'x-forwarded-for'
	];
	return (
		request.headers.get('x-real-ip') ||
		request.headers.get('x-client-ip') ||
		request.headers.get('x-remote-ip') ||
		request.headers.get('x-cluster-client-ip') ||
		request.headers.get('forwarded') ||
		request.headers.get('forwarded-for') ||
		request.headers.get('forwarded-for')
	);
}

export const POST: RequestHandler = async ({ request, locals }) => {
	// 1. dupliate the request:
	const req = new Request(req);
	// 2. Delete any cookies - we dont need them
	request.headers.delete('cookie');
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
	request.headers.set('X-Forwarded-For', ip);
	return fetch('https://plausible.io/api/event', request);

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
