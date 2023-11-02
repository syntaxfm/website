import remarkGfm from 'remark-gfm';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import highlight from 'rehype-highlight';
// import { cache } from '$lib/cache/cache';

import type { Prisma, Show } from '@prisma/client';
import { error } from '@sveltejs/kit';

export const load = async function ({ params, locals, url }) {
	const { show_number } = params;
	const query = {
		where: { number: parseInt(show_number) },
		include: {
			guests: {
				select: {
					Guest: true
				}
			},
			aiShowNote: {
				include: {
					topics: true,
					links: true,
					summary: true,
					tweets: true
				}
			}
		}
	};
	type ShowTemp = Prisma.ShowGetPayload<typeof query>;
	let show_raw: (ShowTemp & Show) | null = null;

	// const cache_key = `show:${show_number}`;

	//Check cache first
	// const show_cached = await cache.get(cache_key);

	// if (show_cached && process.env.NODE_ENV === 'production') {
	// show_raw = show_cached;
	// } else {
	show_raw = await locals.prisma.show.findUnique(query);
	//Set cache after DB query
	// if (show_raw) {
	// cache.set(cache_key, show_raw);
	// }
	// }


	// Check if this is a future show
	const now = new Date();
	const show_date = new Date(show_raw?.date || '');
	const is_admin = locals?.user?.roles?.includes('admin');
	if (show_date > now && !is_admin) {
		throw error(401, `That is a show, but it's in the future! \n\nCome back ${show_date}`);
	}

	const body_excerpt = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(highlight)
		.use(rehypeStringify)
		.process(show_raw?.show_notes || '');

	// Regular expression pattern and replacement
	const pattern = /(<h2>)(?!Show Notes<\/h2>)(.*?)(<\/h2>)/g;
	const replacement = '<h3>$2</h3>';

	const body_string = body_excerpt.toString();
	// the md has h2s in it, it's not reasonable to change all of the md,
	// so I'm making them be h3s instead
	// maybe that's a todo for another day
	const with_h3_body = body_string.replace(pattern, replacement);

	return {
		show: {
			...show_raw,
			show_notes: with_h3_body
		} as ShowTemp & Show,
		meta: {
			title: show_raw?.title,
			image: `https://${url.host}/og/${show_number}.jpg`,
			description:
				show_raw?.aiShowNote?.description ?? show_raw?.show_notes?.match(/(.*?)(?=## )/s)?.[0]
		}
	};
};
