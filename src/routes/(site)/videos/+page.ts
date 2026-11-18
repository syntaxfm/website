import { read_browse_filters } from './browse_filters';
import type { PageLoad } from './$types';

// Page 2 onwards is its own canonical page; the filters (type, topic, order, perPage) are not
export const load: PageLoad = ({ url }) => {
	const { page } = read_browse_filters(url.searchParams);
	return {
		meta: {
			title: `Syntax Episodes and Videos${page > 1 ? ` - Page ${page}` : ''}`,
			canonical: `${url.origin}${url.pathname}${page > 1 ? `?page=${page}` : ''}`
		}
	};
};
