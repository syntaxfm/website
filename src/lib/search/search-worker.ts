import { create_show_search, type ShowSearch } from './search';
import type { SearchNotes, SearchShow, SearchWorkerReply, SearchWorkerRequest } from './types';

let shows_loaded: Promise<ShowSearch> | null = null;
let notes_loaded: Promise<void> | null = null;

async function fetch_json<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Could not load ${url}: ${response.status}`);
	return (await response.json()) as T;
}

addEventListener('message', async (event: MessageEvent<SearchWorkerRequest>) => {
	const message = event.data;

	if (message.type === 'load_shows') {
		shows_loaded ??= fetch_json<SearchShow[]>(`${message.origin}/search-index/shows.json`).then(
			create_show_search
		);
		await shows_loaded;
		postMessage({ type: 'shows_ready' } satisfies SearchWorkerReply);
	}

	if (message.type === 'load_notes') {
		// Fetched while the titles are still loading, added once they're in
		notes_loaded ??= fetch_json<SearchNotes[]>(`${message.origin}/search-index/notes.json`).then(
			async (notes) => (await shows_loaded)?.add_notes(notes)
		);
		await notes_loaded;
		postMessage({ type: 'notes_ready' } satisfies SearchWorkerReply);
	}

	const search = await shows_loaded;
	if (!search) return;

	if (message.type === 'query') {
		postMessage({
			type: 'results',
			query: message.query,
			results: search.search(message.query)
		} satisfies SearchWorkerReply);
	}

	if (message.type === 'recents') {
		const results = message.hrefs.flatMap((href) => search.lookup(href) ?? []);
		postMessage({ type: 'recents', results } satisfies SearchWorkerReply);
	}
});
