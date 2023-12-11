import { error, json } from '@sveltejs/kit';
import { format } from 'date-fns';
import { shows_api_query } from '../query.js';

const query = shows_api_query();

export async function GET({ locals, params }) {
	const show_number = parseInt(params.number);
	const data = await locals.prisma.show.findFirst({
		where: {
			AND: [
				{ number: show_number },
				{
					date: {
						lte: new Date()
					}
				}
			]
		},
		include: {
			...query.include
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
		throw error(404, 'Show not found');
	}
}
