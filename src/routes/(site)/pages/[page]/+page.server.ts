import { error } from '@sveltejs/kit';
import { markdown_to_content } from '#lib/content/markdown_to_content.server.ts';

const content_files = import.meta.glob<string>('../*.md', {
	query: '?raw',
	import: 'default',
	eager: true
});

// Rendering the Markdown is all this page does, and it took 250-380 ms on beta (CPU, so it doesn't
// show in Server-Timing). The files ship with the build, so each rendered page is kept in memory
// for the life of the Worker instance; a deploy starts fresh.
const rendered_pages = new Map<string, ReturnType<typeof render_page>>();

function render_page(markdown: string) {
	// Parse the title. We could move this into front matter if we wanted more control over these pages, but I don't think we need it.
	const title = markdown.split('\n')[0].replaceAll('#', '').trim();
	return {
		props: {
			content: markdown_to_content(markdown)
		},
		meta: {
			title
		}
	};
}

export const load = async ({ params }) => {
	const key = `../${params.page}.md`;
	const markdown = content_files[key];
	if (!markdown) error(404, 'Not found');

	let page = rendered_pages.get(key);
	if (!page) {
		page = render_page(markdown);
		rendered_pages.set(key, page);
	}
	return page;
};
