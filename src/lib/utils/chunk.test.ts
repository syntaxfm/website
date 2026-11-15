import { describe, expect, it } from 'vitest';
import { chunk } from './chunk';

describe('chunk', () => {
	it('splits a list into ordered groups', () => {
		expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
		expect(chunk([], 10)).toEqual([]);
	});

	it('rejects a size that is not a positive integer', () => {
		expect(() => chunk([1], 0)).toThrow(TypeError);
	});
});
