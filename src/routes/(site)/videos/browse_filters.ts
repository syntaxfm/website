// /videos filters, read from the URL. Anything unknown falls back to the default view.

export const BROWSE_TYPES = ['all', 'podcast', 'video'] as const;
export type BrowseType = (typeof BROWSE_TYPES)[number];

export const PER_PAGE_OPTIONS = [29, 49, 69] as const;
const DEFAULT_PER_PAGE = PER_PAGE_OPTIONS[0];
const MAX_PER_PAGE = 100;

// Page URL params, read only (SvelteKit hands out a read-only copy)
type ReadableParams = Pick<URLSearchParams, 'get' | 'has'>;

// Tag slugs: lower case words joined by dashes
export const TOPIC_PATTERN = /^[a-z0-9-]{1,80}$/;

// Filtered views are left out of search results; ?page= isn't, each page is its own canonical page
export const NOINDEX_PARAMS = ['type', 'topic', 'order', 'perPage'] as const;

export type BrowseFilters = {
	type: BrowseType;
	topic: string | null;
	order: 'asc' | 'desc';
	page: number;
	per_page: number;
};

function is_browse_type(value: string | null): value is BrowseType {
	return BROWSE_TYPES.some((type) => type === value);
}

function read_positive_int(value: string | null) {
	const number = Number.parseInt(value ?? '', 10);
	return Number.isFinite(number) && number >= 1 ? number : null;
}

export function read_browse_filters(params: ReadableParams): BrowseFilters {
	const type = params.get('type');
	const topic = params.get('topic');
	return {
		type: is_browse_type(type) ? type : 'all',
		topic: topic && TOPIC_PATTERN.test(topic) ? topic : null,
		order: params.get('order') === 'asc' ? 'asc' : 'desc',
		page: read_positive_int(params.get('page')) ?? 1,
		per_page: Math.min(MAX_PER_PAGE, read_positive_int(params.get('perPage')) ?? DEFAULT_PER_PAGE)
	};
}

export function is_filtered_view(params: ReadableParams) {
	return NOINDEX_PARAMS.some((param) => params.has(param));
}

type FilterOption = { value: string; label: string };

// The menus' options. An empty value is the default, and leaves its param out of the URL.
export const TYPE_OPTIONS: FilterOption[] = [
	{ value: '', label: 'Everything' },
	{ value: 'podcast', label: 'Episodes' },
	{ value: 'video', label: 'Videos' }
];
export const ORDER_OPTIONS: FilterOption[] = [
	{ value: '', label: 'Newest' },
	{ value: 'asc', label: 'Oldest' }
];

// What a menu's button says: the chosen option, or the first (default) one
export function get_option_label(options: FilterOption[], value: string) {
	return options.find((option) => option.value === value)?.label ?? options[0].label;
}
