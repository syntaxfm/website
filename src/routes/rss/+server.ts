import { PUBLIC_URL } from '$env/static/public';
import { replace_special_chars } from '$utilities/replace_special_chars';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async function ({ setHeaders, locals }) {
	const shows = await locals.prisma.show.findMany({ orderBy: { number: 'desc' } });
	const feed_text = `<?xml version="1.0"?>
<rss version="2.0">
   <channel>
      <title>Syntax - Tasty Web Development Treats</title>
      <link>https://${PUBLIC_URL}/shows</link>
			<description>Full Stack Developers Wes Bos and Scott Tolinski dive deep into web development topics, explaining how they work and talking about their own experiences. They cover from JavaScript frameworks like React, to the latest advancements in CSS to simplifying web tooling.></description>
      <language>en</language>
			${shows
				.map(
					(show) => `
		<item>
			<title>${replace_special_chars(show.title)}</title>
			<link>https://${PUBLIC_URL}/shows/${show.number}/${show.slug}</link>
			<guid>${show.number}</guid>
			<pubDate>${show.date}</pubDate>
		</item>`
				)
				.join('')}
   </channel>
</rss>`;

	setHeaders({
		'Cache-Control': 'max-age=0, s-maxage=3600',
		'Content-Type': 'application/xml'
	});

	return new Response(feed_text);
};
