import * as Sentry from '@sentry/sveltekit';
import type { RequestHandler } from '@sveltejs/kit';
import optionsHandler from '../../optionsHandler';

export const OPTIONS = optionsHandler();

export const POST: RequestHandler = async ({ request, locals }) => {
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
