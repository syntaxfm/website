import { json } from '@sveltejs/kit';
import { format } from 'date-fns';
import { shows_api_query } from './query';
import { db } from '$server/db/client';

export async function GET() {
	const data = await db.query.shows.findMany(shows_api_query());

	const shows = data.map((show) => {
		return {
			...show,
			notesFile: show?.md_file,
			displayNumber: show?.number.toString(),
			displayDate: format(new Date(show.date), 'MMMM do, yyyy')
		};
	});

	if (data)
		return json(shows, {
			headers: {
				'Access-Control-Allow-Origin': '*'
			}
		});
}
