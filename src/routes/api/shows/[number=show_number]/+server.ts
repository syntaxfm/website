import { error, json } from '@sveltejs/kit';
import { format } from 'date-fns';
import { shows_api_query } from '../query';
import { db } from '$server/db/client';
import { shows } from '$server/db/schema';
import { and, eq, lte } from 'drizzle-orm';

const query = shows_api_query();

export async function GET({ params }) {
	const show_number = parseInt(params.number);
	const data = await db.query.shows.findFirst({
		where: and(eq(shows.number, show_number), lte(shows.date, new Date())),
		with: {
			...query.with
		}
	});

	if (data) {
		return json(
			{
				...data,
				notesFile: data?.md_file,
				displayNumber: data?.number.toString(),
				displayDate: format(new Date(data.date), 'MMMM do, yyyy')
			},
			{
				headers: {
					'Access-Control-Allow-Origin': '*'
				}
			}
		);
	} else {
		error(404, 'Show not found');
	}
}
