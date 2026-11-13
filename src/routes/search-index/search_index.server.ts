import { db } from '$server/db/client';
import get_show_path from '$utilities/slug';
import type { SearchNotes, SearchShow } from '#lib/search/types.ts';

// Search is split in two so it answers from the first keystroke: titles, numbers and guests
// (~45 KB compressed) load before search opens, and the show notes (~600 KB) load behind.

// Browsers keep a copy for an hour, Cloudflare for five, like /content.json
export const SEARCH_INDEX_HEADERS = {
	'cache-control': `public, max-age=${60 * 60}, s-maxage=${60 * 60 * 5}`
};

// Shows dated in the future are scheduled, not out yet
export async function load_search_shows(): Promise<SearchShow[]> {
	const rows = await db.query.show.findMany({
		columns: {
			number: true,
			title: true,
			slug: true,
			date: true,
			show_type: true,
			youtube_url: true
		},
		where: (s, { lte }) => lte(s.date, new Date()),
		orderBy: (s, { desc }) => [desc(s.number)],
		with: { guests: { columns: {}, with: { guest: { columns: { name: true } } } } }
	});

	return rows.map((row) => ({
		href: get_show_path(row),
		number: row.number,
		title: row.title,
		slug: row.slug,
		date: row.date.toISOString(),
		show_type: row.show_type,
		youtube_url: row.youtube_url,
		guests: row.guests.flatMap(({ guest }) => (guest?.name ? [guest.name] : []))
	}));
}

export async function load_search_notes(): Promise<SearchNotes[]> {
	const rows = await db.query.show.findMany({
		columns: { number: true, slug: true, show_notes: true },
		where: (s, { lte }) => lte(s.date, new Date()),
		orderBy: (s, { desc }) => [desc(s.number)]
	});

	return rows.map((row) => ({ href: get_show_path(row), notes: row.show_notes }));
}
