import type { PageServerLoad } from './$types';
import { processor } from '#utilities/markdown.js';
import rules from './giveaway-rules.md?raw';

export const load: PageServerLoad = async () => {
	const title = rules.split('\n')[0].replaceAll('#', '').trim();
	const html = (await processor.process(rules)).value;

	return {
		props: {
			html
		},
		meta: {
			title
		}
	};
};
