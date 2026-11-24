import { error, json } from '@sveltejs/kit';
import { format } from 'date-fns';
import { shows_api_query } from '../query';
import { db } from '$server/db/client';
import { show as shows } from '$server/db/schema';
import { and, eq } from 'drizzle-orm';
import { has_show_number, released_show_clause } from '$server/content/released';

const query = shows_api_query();

export async function GET({ params }) {
	const show_number = parseInt(params.number);
	const data = await db.query.show.findFirst({
		where: and(eq(shows.number, show_number), released_show_clause()),
		with: {
			...query.with
		}
	});

	if (data && has_show_number(data)) {
		return json(
			{
				...data,
				notesFile: data?.md_file,
				displayNumber: data?.number.toString(),
				displayDate: format(new Date(data.date), 'MMMM do, yyyy'),
				transcript: `/api/transcripts/${data.number}`
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
