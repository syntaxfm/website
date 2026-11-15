// Splits a list into lists of at most `size` items, in order
export function chunk<T>(items: readonly T[], size: number): T[][] {
	if (!Number.isInteger(size) || size < 1) {
		throw new TypeError(`chunk size must be a positive integer, got ${size}`);
	}
	const chunks: T[][] = [];
	for (let index = 0; index < items.length; index += size) {
		chunks.push(items.slice(index, index + size));
	}
	return chunks;
}
