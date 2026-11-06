import type { RequestHandler } from '@sveltejs/kit';
import optionsHandler from '../../optionsHandler';

export const OPTIONS = optionsHandler();
export const POST: RequestHandler = async ({ request, locals }) => {
	// 1. Forward only what Plausible reads. Forwarding every header sent our Host (syntax.fm or
	// beta.syntax.fm), and Plausible's CDN answers 403 to any Host but its own.
	const headers = new Headers({
		'content-type': request.headers.get('content-type') || 'text/plain',
		'user-agent': request.headers.get('user-agent') || ''
	});
	// 2. Set the IP address of the client. Because we use cloudflare, we need to get the IP address from the headers
	const ip =
		request.headers.get('true-client-ip') || // Cloudflare Enterprise
		request.headers.get('CF-Connecting-IP') || // Cloudflare Free, apparently the same thing as true-client-ip but free??
		request.headers.get('x-forwarded-for') || // Common Proxy / Load Balancer (Vercel included)
		locals.request_metadata.ip ||
		'unknown'; // Svelte backup, probably just x-forwarded-for
	// overwrite the IP address with the one we found
	headers.set('X-Forwarded-For', ip);
	// Forward the request to Plausible
	const res = await fetch('https://plausible.io/api/event', {
		method: 'POST',
		headers,
		body: await request.text()
	});
	return new Response(res.body, res);
};
