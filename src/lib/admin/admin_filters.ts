type ReadIntOptions = {
	min?: number;
	max?: number;
};

type UrlUpdates = Record<string, string | number | null | undefined>;

export function read_picklist<T extends string>(
	search_params: URLSearchParams,
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

export function read_string(search_params: URLSearchParams, key: string): string {
	const raw_value = search_params.get(key);
	if (raw_value === null) {
		return '';
	}

	return raw_value.trim();
}

export function read_int(
	search_params: URLSearchParams,
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

export function build_url(current_url: URL, updates: UrlUpdates): string {
	const next_params = new URLSearchParams(current_url.searchParams);

	for (const [key, value] of Object.entries(updates)) {
		if (value === null || value === undefined || value === '') {
			next_params.delete(key);
			continue;
		}

		next_params.set(key, String(value));
	}

	const query_string = next_params.toString();
	return query_string.length > 0 ? `${current_url.pathname}?${query_string}` : current_url.pathname;
}

export function has_any_filter(
	search_params: URLSearchParams,
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
