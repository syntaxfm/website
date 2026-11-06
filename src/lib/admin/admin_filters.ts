import type { ReadonlyURL, ReadonlyURLSearchParams } from '$app/state';
import type { ResolvedPathname } from '$app/types';

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
