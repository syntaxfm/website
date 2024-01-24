import type { RequestHandler } from '@sveltejs/kit';
import { PUBLIC_URL } from '$env/static/public';

const site = `https://${PUBLIC_URL}`;

export const GET: RequestHandler = async function GET({ setHeaders, locals }) {
	const shows = await locals.prisma.show.findMany({
		where: {
			date: {
				lte: new Date() // only shows in the future
			}
		}
	});
	const guests = await locals.prisma.guest.findMany();
	const xml = `<?xml version="1.0" encoding="UTF-8" ?>
    <urlset
      xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:news="https://www.google.com/schemas/sitemap-news/0.9"
      xmlns:xhtml="https://www.w3.org/1999/xhtml"
      xmlns:mobile="https://www.google.com/schemas/sitemap-mobile/1.0"
      xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
      xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"
    >
      <url>
        <loc>${site}</loc>
        <changefreq>daily</changefreq>
        <priority>1</priority>
      </url>

	  <url>
        <loc>${site}/about</loc>
        <changefreq>monthly</changefreq>
        <priority>0.4</priority>
      </url>

			<url>
        <loc>${site}/shows</loc>
        <changefreq>daily</changefreq>
        <priority>1</priority>
      </url>
			<url>
        <loc>${site}/potluck</loc>
        <changefreq>monthly</changefreq>
        <priority>0.4</priority>
      </url>
			<url>
        <loc>${site}/pages/privacy</loc>
        <changefreq>yearly</changefreq>
        <priority>0.1</priority>
      </url>
			<url>
        <loc>${site}/potluck</loc>
        <changefreq>monthly</changefreq>
        <priority>0.4</priority>
      </url>

			<url>
        <loc>${site}/system/colors</loc>
        <changefreq>monthly</changefreq>
        <priority>0.2</priority>
      </url>
			<url>
        <loc>${site}/system/layout</loc>
        <changefreq>monthly</changefreq>
        <priority>0.2</priority>
      </url>
			<url>
        <loc>${site}/system/typography</loc>
        <changefreq>monthly</changefreq>
        <priority>0.2</priority>
      </url>
			<url>
        <loc>${site}/system/theme</loc>
        <changefreq>monthly</changefreq>
        <priority>0.2</priority>
      </url>

		${shows
			?.map(
				(show) => `
  <url>
    <loc>${site}/show/${show?.number}/${show?.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  `
			)
			.join('')}

		${shows
			?.map(
				(show) => `
  <url>
    <loc>${site}/show/${show?.number}/${show?.slug}/transcript</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  `
			)
			.join('')}
      <url>
        <loc>${site}/guests</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>
		${guests
			?.map(
				(guest) => `
  <url>
    <loc>${site}/guest/${guest?.name_slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  `
			)
			.join('')}

</urlset>
`;

	setHeaders({
		'cache-control': 'max-age=0, s-maxage=3600',
		'Content-Type': 'application/xml'
	});

	return new Response(xml);
};
