import { in_order_added } from '#lib/utils/in_order_added.ts';
import { db } from '$server/db/client';
import get_show_path from '$utilities/slug';
import type { SearchNotes, SearchShow } from '#lib/search/types.ts';
import { has_show_number, released_show_clause } from '$server/content/released';

// Search is split in two so it answers from the first keystroke: titles, numbers and guests
// (~45 KB compressed) load before search opens, and the show notes (~600 KB) load behind.

// Browsers keep a copy for an hour, Cloudflare for five
export const SEARCH_INDEX_HEADERS = {
	'cache-control': `public, max-age=${60 * 60}, s-maxage=${60 * 60 * 5}`
};

// Released shows only: a draft or a scheduled episode isn't out yet
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
		where: released_show_clause(),
		orderBy: (s, { desc }) => [desc(s.number)],
		with: {
			guests: {
				orderBy: in_order_added,
				columns: {},
				with: { guest: { columns: { name: true } } }
			}
		}
	});

	return rows.filter(has_show_number).map((row) => ({
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
		where: released_show_clause(),
		orderBy: (s, { desc }) => [desc(s.number)]
	});

	return rows
		.filter(has_show_number)
		.map((row) => ({ href: get_show_path(row), notes: row.show_notes }));
}
