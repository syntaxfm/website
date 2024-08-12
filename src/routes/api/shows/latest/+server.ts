import { json } from '@sveltejs/kit';
import { format } from 'date-fns';
import { shows_api_query } from '../query.js';
import { prisma_client } from '$/hooks.server.js';

export async function GET() {
	const data = await prisma_client.show.findFirst(shows_api_query());
	if (data)
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
}
