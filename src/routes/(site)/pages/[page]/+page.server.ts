import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import remarkGfm from 'remark-gfm';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';

export const load: PageServerLoad = async ({ params }) => {
	const contentFiles = import.meta.glob('../*.md', { as: 'raw', eager: true });

	const processor = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw) // allow html within markdown files
		.use(rehypeStringify);

	console.log('contentFiles', contentFiles);

	const key = `../${params.page}.md`;

	if (contentFiles[key]) {
		const content = processor.processSync(contentFiles[key]).value;
		return {
			props: {
				html: content
			}
		};
	} else {
		throw error(404, 'Not found');
	}
};
