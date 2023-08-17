import remarkGfm from 'remark-gfm';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import highlight from 'rehype-highlight';
import { cache } from '$lib/cache/cache';

import type { Prisma, Show } from '@prisma/client';
import { transcript_with_utterances } from '$server/ai/queries.js';

export const load = async function ({ setHeaders, params, locals }) {
	const { show_number } = params;
	const query = {
		where: { number: parseInt(show_number) },
		include: {
			guests: {
				select: {
					Guest: true
				}
			},
			transcript: transcript_with_utterances,
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
	type Show = Prisma.ShowGetPayload<typeof query>;
	let show_raw: Show | null = null;
	const cache_key = `show:${show_number}`;

	//Check cache first
	const show_cached = await cache.get(cache_key);

	if (show_cached && process.env.NODE_ENV === 'production') {
		show_raw = show_cached as Show;
	} else {
		show_raw = await locals.prisma.show.findFirst(query);
		//Set cache after DB query
		cache.set(cache_key, show_raw);
	}

	const body_excerpt = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(highlight)
		.use(rehypeStringify)
		.process(show_raw?.show_notes || '');

	setHeaders({
		'cache-control': 'max-age=240'
	});

	return {
		show: {
			...show_raw,
			show_notes: body_excerpt.toString()
		}
	};
};
