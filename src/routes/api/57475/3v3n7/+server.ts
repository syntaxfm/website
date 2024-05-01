import type { RequestHandler } from '@sveltejs/kit';
import optionsHandler from '../../optionsHandler';

export const OPTIONS = optionsHandler();
export const POST: RequestHandler = async ({ request, locals }) => {
	// 1. Make a copy of the headers so we can modify them. This is necessary because the headers are immutable.
	const req = new Request(request);
	// 2. Delete any cookies - we dont need them
	req.headers.delete('cookie');
	// 3. Set the IP address of the client. Because we use cloudflare, we need to get the IP address from the headers
	const ip =
		request.headers.get('true-client-ip') || // Cloudflare Enterprise
		request.headers.get('CF-Connecting-IP') || // Cloudflare Free, apparently the same thing as true-client-ip but free??
		request.headers.get('x-forwarded-for') || // Common Proxy / Load Balancer (Vercel included)
		locals.session.ip; // Svelte backup, probably just x-forwarded-for
	// overwrite the IP address with the one we found
	req.headers.set('X-Forwarded-For', ip);
	// Forward the request to Plausible
	const res = await fetch('https://plausible.io/api/event', req);
	return new Response(res.body, res);
};
