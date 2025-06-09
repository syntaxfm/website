import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

// Safely access environment variable
const PUBLIC_URL = env.PUBLIC_URL;

export const GET: RequestHandler = async function GET({ setHeaders }) {
	const baseUrl = PUBLIC_URL || 'syntax.fm';
	const robotsTxt = `User-agent: *
Disallow: /admin
Disallow: /haters
Disallow: /api

Sitemap:  https://${baseUrl}/sitemap.xml`;

	setHeaders({
		'cache-control': 'max-age=0, s-maxage=3600',
		'Content-Type': 'text/plain'
	});

	return new Response(robotsTxt);
};
