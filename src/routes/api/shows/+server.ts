import { json } from '@sveltejs/kit';
import { format } from 'date-fns';

export async function GET({ locals }) {
	const data = await locals.prisma.show.findMany({
		orderBy: { number: 'desc' },
		include: {
			guests: {
				select: {
					Guest: {
						select: {
							github: true,
							name: true
						}
					}
				}
			}
		}
	});

	const shows = data.map((show) => {
		return {
			...show,
			notesFile: show?.md_file,
			displayNumber: show?.number.toString(),
			displayDate: format(new Date(show.date), 'MMMM do, yyyy')
		};
	});

	if (data) return json(shows);
}
