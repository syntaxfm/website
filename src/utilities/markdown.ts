import remarkGfm from 'remark-gfm';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeStringify from 'rehype-stringify';
import rehypeHighlight from 'rehype-highlight';
import remarkHeadingId from 'remark-heading-id';

export const processor = unified()
  .use(remarkParse)
	.use(remarkGfm)
  .use(remarkHeadingId, { defaults: true })
	.use(remarkRehype, { allowDangerousHtml: true })
	.use(rehypeRaw) // allow html within markdown files
  .use(rehypeHighlight)
	.use(rehypeStringify)
  .use(rehypeAutolinkHeadings, { behavior: 'append', })
