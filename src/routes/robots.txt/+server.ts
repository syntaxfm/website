import { PUBLIC_URL } from '$env/static/public';

export const GET = async function GET({ setHeaders }) {
	const robotsTxt = `User-agent: *
Disallow: /admin
Disallow: /haters
Disallow: /api

Sitemap:  https://${PUBLIC_URL}/sitemap.xml`;

	setHeaders({
		'cache-control': 'max-age=0, s-maxage=3600',
		'Content-Type': 'text/plain'
	});

	return new Response(robotsTxt);
};
