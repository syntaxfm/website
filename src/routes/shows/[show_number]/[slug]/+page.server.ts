import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import remarkGfm from 'remark-gfm';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import highlight from 'rehype-highlight';
import type { Show } from '@prisma/client';
export const load: PageServerLoad = async function ({ params, locals }) {
	const { show_number } = params;

	const show_raw: Show = await locals.prisma.show.findFirst({
		where: { number: parseInt(show_number) }
	});
	const body_excerpt = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(highlight)
		.use(rehypeStringify)
		.process(show_raw?.show_notes || '');
	return {
		show: {
			...show_raw,
			show_notes: body_excerpt.toString()
		}
	};
};
