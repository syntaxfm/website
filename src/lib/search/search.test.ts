import { describe, expect, it } from 'vitest';
import { create_show_search } from './search';
import type { SearchShow } from './types';

function show(number: number, title: string, guests: string[] = []): SearchShow {
	return {
		href: `/show/${number}/show-${number}`,
		number,
		title,
		slug: `show-${number}`,
		date: '2026-11-01T00:00:00.000Z',
		show_type: 'TASTY',
		youtube_url: null,
		guests
	};
}

const SHOWS = [
	show(900, 'Why we love CSS', ['Una Kravets']),
	show(901, 'Svelte runes deep dive', ['Rich Harris']),
	show(902, 'Server side Svelte'),
	show(903, 'Potluck')
];

const numbers = (results: SearchShow[]) => results.map((result) => result.number);

describe('create_show_search', () => {
	it('finds shows by title, number and guest before notes load', () => {
		const search = create_show_search(SHOWS);
		expect(numbers(search.search('css'))).toEqual([900]);
		expect(numbers(search.search('903'))).toEqual([903]);
		expect(numbers(search.search('rich'))).toEqual([901]);
	});

	it('puts titles that start with the words first', () => {
		const search = create_show_search(SHOWS);
		expect(numbers(search.search('svelte'))).toEqual([901, 902]);
	});

	it('adds shows that match only in their notes, after the title matches', async () => {
		const search = create_show_search(SHOWS);
		expect(numbers(search.search('vite'))).toEqual([]);

		await search.add_notes([
			{ href: SHOWS[3].href, notes: 'Vite plugins and Svelte questions' },
			{ href: SHOWS[0].href, notes: 'Container queries' }
		]);

		expect(numbers(search.search('vite'))).toEqual([903]);
		expect(numbers(search.search('svelte'))).toEqual([901, 902, 903]);
	});

	it('answers from titles while the notes are still being indexed', async () => {
		const search = create_show_search(SHOWS);
		const many_notes = Array.from({ length: 120 }, (_, i) => ({
			href: i === 119 ? SHOWS[3].href : `/show/${i}/other`,
			notes: i === 119 ? 'vite' : 'other notes'
		}));

		const adding = search.add_notes(many_notes);
		expect(numbers(search.search('svelte'))).toEqual([901, 902]);
		await adding;
		expect(numbers(search.search('vite'))).toEqual([903]);
	});

	it('looks up a recent search by its link', () => {
		const search = create_show_search(SHOWS);
		expect(search.lookup('/show/902/show-902')?.title).toBe('Server side Svelte');
		expect(search.lookup('/show/1/gone')).toBeUndefined();
	});
});
