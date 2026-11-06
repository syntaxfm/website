import { PUBLIC_URL } from '$app/env/public';

// Only the production site is crawlable; betas and previews would show up as duplicate content
const PRODUCTION_HOST = 'syntax.fm';

export const GET = async function GET({ setHeaders }) {
	const robots_txt =
		PUBLIC_URL === PRODUCTION_HOST
			? `User-agent: *
Disallow: /admin
Disallow: /haters
Disallow: /api

Sitemap:  https://${PUBLIC_URL}/sitemap.xml`
			: `User-agent: *
Disallow: /`;

	setHeaders({
		'cache-control': 'max-age=0, s-maxage=3600',
		'Content-Type': 'text/plain'
	});

	return new Response(robots_txt);
};
