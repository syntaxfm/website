import { processor } from '$utilities/markdown';
import { db } from '$server/db/client';
import { show } from '$server/db/schema';
import { lte, desc } from 'drizzle-orm';
import { query } from '$app/server';

function cleanUpLines(string: string) {
	return string
		.trim()
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => !line.startsWith('#') || line.length === 0)
		.join('\n');
}

export const get_sick_picks = query(async () => {
	// Load ALL shows from the database
	const showsData = await db.query.show.findMany({
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
	const sickPicks = showsData
		.filter((current_show) => {
			const lines = current_show.show_notes.split('\n');
			return lines.some((line) => {
				const lowerLine = line.toLowerCase();
				return (
					lowerLine.match(/s(i+)ck/)?.length &&
					lowerLine.match('p(i+)ck')?.length &&
					(lowerLine.startsWith('#') || lowerLine.startsWith('*'))
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
				rendered: processor.processSync(current_show.picks.join('\n')).value
			};
		});
	return sickPicks;
});
