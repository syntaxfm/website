import { json } from '@sveltejs/kit';
import { format } from 'date-fns';

export async function GET({ locals, params }) {
	const data = await locals.prisma.show.findUnique({
		where: {
			number: parseInt(params.number)
		},
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
	if (data)
		return json({
			...data,
			notesFile: data?.md_file,
			displayNumber: data?.number.toString(),
			displayDate: format(new Date(data.date), 'MMMM do, yyyy')
		});
}
