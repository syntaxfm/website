import type { ReadonlyURL, ReadonlyURLSearchParams } from '$app/state';
import type { ResolvedPathname } from '$app/types';
import { humanize_enum } from '#lib/utils/format_enum.ts';

export type FilterOption = { value: string; label: string };

/** Menu options for enum values, readable ("PUBLISHED" → "Published"), with "All" ('') first when asked. */
export function to_filter_options(
	values: readonly string[],
	{ include_all = false } = {}
): FilterOption[] {
	const options = values.map((value) => ({ value, label: humanize_enum(value) }));
	return include_all ? [{ value: '', label: 'All' }, ...options] : options;
}

type ReadIntOptions = {
	min?: number;
	max?: number;
};

type UrlUpdates = Record<string, string | number | null | undefined>;

export function read_picklist<T extends string>(
	search_params: ReadonlyURLSearchParams,
	key: string,
	allowed: readonly T[],
	fallback: T
): T {
	const raw_value = search_params.get(key);
	if (raw_value === null) {
		return fallback;
	}

	return (allowed as readonly string[]).includes(raw_value) ? (raw_value as T) : fallback;
}

export function read_string(search_params: ReadonlyURLSearchParams, key: string): string {
	const raw_value = search_params.get(key);
	if (raw_value === null) {
		return '';
	}

	return raw_value.trim();
}

export function read_int(
	search_params: ReadonlyURLSearchParams,
	key: string,
	fallback: number,
	options?: ReadIntOptions
): number {
	const raw_value = search_params.get(key);
	if (raw_value === null) {
		return clamp_int(fallback, options);
	}

	const parsed = Number.parseInt(raw_value, 10);
	if (!Number.isFinite(parsed)) {
		return clamp_int(fallback, options);
	}

	return clamp_int(parsed, options);
}

export function build_url(current_url: ReadonlyURL, updates: UrlUpdates): ResolvedPathname {
	// page.url is readonly in SvelteKit 3, so build from a copy of its query
	const next_params = new URLSearchParams(current_url.search);

	for (const [key, value] of Object.entries(updates)) {
		if (value === null || value === undefined || value === '') {
			next_params.delete(key);
			continue;
		}

		next_params.set(key, String(value));
	}

	const query_string = next_params.toString();
	// current_url.pathname is already base-path-resolved, so the result is a ResolvedPathname.
	return (
		query_string.length > 0 ? `${current_url.pathname}?${query_string}` : current_url.pathname
	) as ResolvedPathname;
}

export function has_any_filter(
	search_params: ReadonlyURLSearchParams,
	filter_keys: readonly string[]
): boolean {
	for (const key of filter_keys) {
		const raw_value = search_params.get(key);
		if (raw_value !== null && raw_value !== '') {
			return true;
		}
	}

	return false;
}

function clamp_int(value: number, options?: ReadIntOptions): number {
	let next_value = value;
	if (options?.min !== undefined && next_value < options.min) {
		next_value = options.min;
	}

	if (options?.max !== undefined && next_value > options.max) {
		next_value = options.max;
	}

	return next_value;
}

// One page of a list that's already in memory, shaped like the server lists' results
export function page_of<T>(
	items: readonly T[],
	page: number,
	page_size: number
): { items: T[]; total: number; page: number; total_pages: number } {
	const total_pages = Math.max(1, Math.ceil(items.length / page_size));
	const current_page = Math.min(Math.max(1, page), total_pages);
	const start = (current_page - 1) * page_size;
	return {
		items: items.slice(start, start + page_size),
		total: items.length,
		page: current_page,
		total_pages
	};
}
