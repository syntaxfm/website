import type { PageServerLoad } from './$types';
import { processor } from '$/utilities/markdown';

function cleanUpLines(string: string) {
	return string
		.trim()
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => !line.startsWith('#') || line.length === 0)
		.join('\n');
}

export const load: PageServerLoad = async function ({ locals, setHeaders }) {
	// Load ALL shows from the database
	const shows = await locals.prisma.show.findMany({
		select: {
			show_type: true,
			number: true,
			title: true,
			show_notes: true,
			guests: {
				select: {
					Guest: {
						select: {
							name: true
						}
					}
				}
			}
		},
		where: {
			date: {
				lte: new Date()
			}
		}
	});

	// Filter out shows that don't have Sick Picks in the show notes somewhere
	const sickPicks = shows
		.filter((show) => {
			const lines = show.show_notes.split('\n');
			return lines.some((line) => {
				const lowerLine = line.toLowerCase();
				return (
					lowerLine.match(/s(i+)ck/)?.length &&
					lowerLine.match('p(i+)ck')?.length &&
					(lowerLine.startsWith('#') || lowerLine.startsWith('*'))
				);
			});
		})
		.map((show) => {
			// TODO: needs to conver ×sick×picks×
			// match  ## Sick Picks headings, ××× SIIIIICK ××× PIIIICKS ×××
			const headings = show.show_notes.match(/(#) (.*)s(i+)ck([\s\S]*?)(?=#)/gi);
			// Match  * Sick Pick: bullets
			const bullets = show.show_notes.match(/(\*) sick pick:([\s\S]*?)(?=\n)/gi);
			return {
				number: show.number,
				title: show.title,
				guests: show.guests.map((guest) => guest.Guest.name),
				picks: [...(headings || []), ...(bullets || [])].map((line) => cleanUpLines(line))
			};
		})
		.sort((a, b) => b.number - a.number)
		.map((show) => {
			// Markdown render the picks
			return {
				...show,
				rendered: processor.processSync(show.picks.join('\n')).value
			};
		});

	// Cache for 3 days, stale for 1 hour OK
	setHeaders({
		'cache-control': `public s-maxage=${60 * 60 * 24 * 3}, stale-while-revalidate=${60 * 60 * 1}`
	});

	return {
		meta: {
			title: 'Sick Picks'
		},
		sickPicks
	};
};
