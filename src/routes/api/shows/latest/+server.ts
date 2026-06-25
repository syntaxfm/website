import { json } from '@sveltejs/kit';
import { format } from 'date-fns';
import { shows_api_query } from '../query';
import { db } from '$server/db/client';

export async function GET() {
	const data = await db.query.shows.findFirst(shows_api_query());
	if (data)
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
}
