import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	const response = await fetch('https://plausible.io/js/script.js');
	return new Response(await response.text(), {
		headers: {
			'content-type': 'application/javascript',
			'cache-control':
				response.headers.get('cache-control') || 'public, must-revalidate, max-age=86400'
		}
	});
};
