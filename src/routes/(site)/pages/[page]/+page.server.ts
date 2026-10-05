import { error } from '@sveltejs/kit';
import { markdown_to_content } from '$lib/content/markdown_to_content.server';

export const load = async ({ params }) => {
	const content_files = import.meta.glob<string>('../*.md', {
		query: '?raw',
		import: 'default',
		eager: true
	});

	const key = `../${params.page}.md`;

	if (content_files[key]) {
		// Parse the title. We could move this into front matter if we wanted more control over these pages, but I don't think we need it.
		const title = content_files[key].split('\n')[0].replaceAll('#', '').trim();
		return {
			props: {
				content: markdown_to_content(content_files[key])
			},
			meta: {
				title
			}
		};
	} else {
		error(404, 'Not found');
	}
};
