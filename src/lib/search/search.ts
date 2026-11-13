import { Index } from 'flexsearch';
import type { SearchNotes, SearchShow } from './types';

const RESULT_LIMIT = 50;

export interface ShowSearch {
	// Notes come later than titles: until they're added, search covers titles, numbers and guests
	add_notes(notes: SearchNotes[]): void;
	search(query: string): SearchShow[];
	lookup(href: string): SearchShow | undefined;
}

function escape_regex(text: string) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Searches shows by title, number and guest at once, and by their notes once those are added.
 * Shows matching by title, number or guest come before shows matching only in their notes.
 */
export function create_show_search(shows: SearchShow[]): ShowSearch {
	const by_href = new Map(shows.map((show) => [show.href, show]));
	const show_index = new Index({ tokenize: 'forward' });
	for (const show of shows) {
		show_index.add(show.href, `${show.title} ${show.number} ${show.guests.join(' ')}`);
	}
	let notes_index: Index | null = null;

	return {
		add_notes(notes) {
			const index = new Index({ tokenize: 'forward' });
			for (const { href, notes: text } of notes) index.add(href, text);
			notes_index = index;
		},

		search(query) {
			const starts_title = new RegExp(`(^|\\b)${escape_regex(query)}`, 'i');
			const show_hits = show_index
				.search(query, RESULT_LIMIT)
				.map(String)
				.toSorted((a, b) => {
					const a_title = starts_title.test(by_href.get(a)?.title ?? '');
					const b_title = starts_title.test(by_href.get(b)?.title ?? '');
					return Number(b_title) - Number(a_title);
				});
			const notes_hits = notes_index?.search(query, RESULT_LIMIT).map(String) ?? [];

			return [...new Set([...show_hits, ...notes_hits])]
				.slice(0, RESULT_LIMIT)
				.flatMap((href) => by_href.get(href) ?? []);
		},

		lookup(href) {
			return by_href.get(href);
		}
	};
}
