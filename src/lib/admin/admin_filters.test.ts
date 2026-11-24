import { describe, expect, it } from 'vitest';
import { page_of, to_filter_options } from './admin_filters.ts';

describe('to_filter_options', () => {
	it('makes enum values readable', () => {
		expect(to_filter_options(['PUBLISHED', 'SUPPER'])).toEqual([
			{ value: 'PUBLISHED', label: 'Published' },
			{ value: 'SUPPER', label: 'Supper Club' }
		]);
	});

	it('puts "All" first when asked', () => {
		expect(to_filter_options(['DRAFT'], { include_all: true })).toEqual([
			{ value: '', label: 'All' },
			{ value: 'DRAFT', label: 'Draft' }
		]);
	});
});

describe('page_of', () => {
	const items = [1, 2, 3, 4, 5];

	it('slices one page and counts the pages', () => {
		expect(page_of(items, 2, 2)).toEqual({ items: [3, 4], total: 5, page: 2, total_pages: 3 });
	});

	it('keeps the page inside the list', () => {
		expect(page_of(items, 9, 2).page).toBe(3);
		expect(page_of([], 1, 2)).toEqual({ items: [], total: 0, page: 1, total_pages: 1 });
	});
});
