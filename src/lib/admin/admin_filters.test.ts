import { describe, expect, it } from 'vitest';
import { to_filter_options } from './admin_filters.ts';

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
