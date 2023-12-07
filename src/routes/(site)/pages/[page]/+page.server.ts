import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import remarkGfm from 'remark-gfm';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';

export const processor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(remarkRehype, { allowDangerousHtml: true })
	.use(rehypeRaw) // allow html within markdown files
	.use(rehypeStringify);

export const load: PageServerLoad = async ({ params }) => {
	const contentFiles = import.meta.glob('../*.md', { as: 'raw', eager: true });

	const key = `../${params.page}.md`;

	if (contentFiles[key]) {
		// Parse the title. We could move this into front matter if we wanted more control over these pages, but I don't think we need it.
		const title = contentFiles[key].split('\n')[0].replaceAll('#', '').trim();
		const content = processor.processSync(contentFiles[key]).value;

		return {
			props: {
				html: content
			},
			meta: {
				title
			}
		};
	} else {
		throw error(404, 'Not found');
	}
};
