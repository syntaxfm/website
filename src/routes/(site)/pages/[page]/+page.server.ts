import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { processor } from '$/utilities/markdown';

export const load: PageServerLoad = async ({ params }) => {
	const contentFiles = import.meta.glob('../*.md', { as: 'raw', eager: true });

	const key = `../${params.page}.md`;

	if (contentFiles[key]) {
		// Parse the title. We could move this into front matter if we wanted more control over these pages, but I don't think we need it.
		const title = contentFiles[key].split('\n')[0].replaceAll('#', '').trim();
		const content = (await processor.process(contentFiles[key])).value;

		return {
			props: {
				html: content
			},
			meta: {
				title
			}
		};
	} else {
		error(404, 'Not found');
	}
};
