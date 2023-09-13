import remarkGfm from 'remark-gfm';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import highlight from 'rehype-highlight';
import { cache } from '$lib/cache/cache';
import type { Show } from '@prisma/client';

export const load = async function ({ setHeaders, params, locals }) {
	const { show_number } = params;
	let show_raw: Show | null = null;
	const cache_key = `show:${show_number}`;

	//Check cache first
	const show_cached = await cache.get(cache_key);

	if (show_cached) {
		show_raw = show_cached;
	} else {
		show_raw = await locals.prisma.show.findFirst({
			where: { number: parseInt(show_number) },
			include: {
				guests: {
					select: {
						Guest: true
					}
				}
			}
		});
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

	const body_string = body_excerpt.toString();
	// the md has h2s in it, it's not reasonable to change all of the md,
	// so I'm making them be h3s instead
	const with_h3_body = body_string.replaceAll('h2', 'h3');

	setHeaders({
		'cache-control': 'max-age=240'
	});

	return {
		show: {
			...show_raw,
			show_notes: with_h3_body
		}
	};
};
