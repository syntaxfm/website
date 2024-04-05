import type { RequestHandler } from '@sveltejs/kit';

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
		console.error('Error proxying plausible event:', {
			status: response.status,
			statusText: response.statusText,
			body: responseBody
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
