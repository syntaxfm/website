import remarkGfm from 'remark-gfm';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import highlight from 'rehype-highlight';
import { cache } from '$lib/cache/cache';

import type { Show } from '@prisma/client';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async function ({ setHeaders, params, locals }) {
	const { show_number } = params;
	let show_raw: Show = null;
	const cache_key = `show:${show_number}`;

	const show_cached = await cache.get(cache_key);

	if (!show_cached) {
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
	} else {
		show_raw = show_cached;
		locals.prisma.show
			.findFirst({
				where: { number: parseInt(show_number) },
				include: {
					guests: {
						select: {
							Guest: true
						}
					}
				}
			})
			.then((show) => {
				cache.set(cache_key, show);
			});
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
