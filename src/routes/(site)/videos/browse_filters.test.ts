import { describe, expect, it } from 'vitest';
import {
	get_option_label,
	is_filtered_view,
	read_browse_filters,
	TYPE_OPTIONS
} from './browse_filters';

const params = (query: string) => new URLSearchParams(query);

describe('read_browse_filters', () => {
	it('shows everything, newest first, on a plain visit', () => {
		expect(read_browse_filters(params(''))).toEqual({
			type: 'all',
			topic: null,
			order: 'desc',
			page: 1,
			per_page: 29
		});
	});

	it('reads every filter from the URL', () => {
		expect(read_browse_filters(params('type=video&topic=css&order=asc&page=3&perPage=49'))).toEqual(
			{ type: 'video', topic: 'css', order: 'asc', page: 3, per_page: 49 }
		);
	});

	it('falls back to the default for values it does not know', () => {
		expect(
			read_browse_filters(params('type=shorts&topic=Not%20A%20Slug&order=up&page=-2&perPage=0'))
		).toEqual({ type: 'all', topic: null, order: 'desc', page: 1, per_page: 29 });
	});

	it('caps the page size', () => {
		expect(read_browse_filters(params('perPage=5000')).per_page).toBe(100);
	});
});

describe('is_filtered_view', () => {
	it('keeps plain pages in search results, page numbers included', () => {
		expect(is_filtered_view(params(''))).toBe(false);
		expect(is_filtered_view(params('page=4'))).toBe(false);
	});

	it('leaves filtered views out of search results', () => {
		expect(is_filtered_view(params('type=podcast'))).toBe(true);
		expect(is_filtered_view(params('topic=css&page=2'))).toBe(true);
	});
});

describe('get_option_label', () => {
	it("names the chosen option, or the default when there's none", () => {
		expect(get_option_label(TYPE_OPTIONS, 'video')).toBe('Videos');
		expect(get_option_label(TYPE_OPTIONS, '')).toBe('Everything');
		expect(get_option_label(TYPE_OPTIONS, 'nope')).toBe('Everything');
	});
});
