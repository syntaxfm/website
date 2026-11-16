import type { PageLoad } from './$types';

// Page 2 onwards is its own canonical page; the filters (order, perPage) are not
export const load: PageLoad = ({ url }) => {
	const page_number = Math.max(1, parseInt(url.searchParams.get('page') || '1') || 1);
	return {
		meta: {
			title: `Syntax Podcast Shows${page_number > 1 ? ` - Page ${page_number}` : ''}`,
			canonical: `${url.origin}${url.pathname}${page_number > 1 ? `?page=${page_number}` : ''}`
		}
	};
};
