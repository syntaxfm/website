import { markdown_to_content } from '#lib/content/markdown_to_content.server.ts';
import { db } from '$server/db/client';
import { show } from '$server/db/schema';
import { lte, desc } from 'drizzle-orm';
import { query } from '$app/server';
import { edge_cached } from '$server/edge_cache';

function cleanUpLines(string: string) {
	return string
		.trim()
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => !line.startsWith('#') || line.length === 0)
		.join('\n');
}

// Reads every show's notes and renders each pick's Markdown: ~1.2 s per call uncached. Picks only
// change when an episode comes out, so the result is cached at the edge.
export const get_sick_picks = query(() =>
	edge_cached(
		'sick-picks',
		{ fresh_seconds: 60 * 60, stale_seconds: 60 * 60 * 24 * 7 },
		load_sick_picks
	)
);

async function load_sick_picks() {
	// Load ALL shows from the database
	const shows_data = await db.query.show.findMany({
		columns: {
			number: true,
			title: true,
			show_notes: true
		},
		with: {
			guests: {
				with: {
					guest: {
						columns: {
							name: true
						}
					}
				}
			}
		},
		orderBy: [desc(show.number)],
		where: lte(show.date, new Date())
	});

	// Filter out shows that don't have Sick Picks in the show notes somewhere
	const sick_picks = shows_data
		.filter((current_show) => {
			const lines = current_show.show_notes.split('\n');
			return lines.some((line) => {
				const lower_line = line.toLowerCase();
				return (
					lower_line.match(/s(i+)ck/)?.length &&
					lower_line.match('p(i+)ck')?.length &&
					(lower_line.startsWith('#') || lower_line.startsWith('*'))
				);
			});
		})
		.map((current_show) => {
			// TODO: needs to conver ×sick×picks×
			// match  ## Sick Picks headings, ××× SIIIIICK ××× PIIIICKS ×××
			const headings = current_show.show_notes.match(/(#) (.*)s(i+)ck([\s\S]*?)(?=#)/gi);
			// Match  * Sick Pick: bullets
			const bullets = current_show.show_notes.match(/(\*) sick pick:([\s\S]*?)(?=\n)/gi);
			return {
				number: current_show.number,
				title: current_show.title,
				guests: current_show.guests.map((guest) => guest.guest.name),
				picks: [...(headings || []), ...(bullets || [])].map((line) => cleanUpLines(line))
			};
		})
		.map((current_show) => {
			// Markdown render the picks
			return {
				...current_show,
				notes: markdown_to_content(current_show.picks.join('\n'))
			};
		});
	return sick_picks;
}
