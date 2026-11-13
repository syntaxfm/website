import type { Show } from '$server/db/types';

// A show in the small index that loads first: what a result card renders, and the guests to
// search by. Built by /search-index/shows.json.
export interface SearchShow {
	href: string;
	number: number;
	title: string;
	slug: string;
	// ISO date: the index is JSON
	date: string;
	show_type: Show['show_type'];
	youtube_url: string | null;
	guests: string[];
}

// A show's notes, in the big index that loads when search opens. Built by /search-index/notes.json.
export interface SearchNotes {
	href: string;
	notes: string;
}

export type SearchWorkerRequest =
	| { type: 'load_shows'; origin: string }
	| { type: 'load_notes'; origin: string }
	| { type: 'query'; query: string }
	| { type: 'recents'; hrefs: string[] };

export type SearchWorkerReply =
	| { type: 'shows_ready' }
	| { type: 'notes_ready' }
	| { type: 'results'; query: string; results: SearchShow[] }
	| { type: 'recents'; results: SearchShow[] };
