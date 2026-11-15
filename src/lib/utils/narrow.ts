// Reading untyped JSON (third-party API responses) without casts: each helper narrows `unknown`
// and returns a safe empty value when the shape isn't what was expected.

export function is_record(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Walks object keys and array indexes; any missing step gives undefined
export function read_path(value: unknown, path: readonly (string | number)[]): unknown {
	let current = value;
	for (const key of path) {
		if (typeof key === 'number') {
			if (!Array.isArray(current)) return undefined;
			current = current[key];
		} else {
			if (!is_record(current)) return undefined;
			current = current[key];
		}
	}
	return current;
}

export function as_number(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function as_string(value: unknown): string | null {
	return typeof value === 'string' ? value : null;
}

export function as_array(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}
