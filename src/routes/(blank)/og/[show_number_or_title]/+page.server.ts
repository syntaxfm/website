import { prisma_client } from '$/hooks.server';
import { SHOW_QUERY } from '$server/ai/queries.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ setHeaders, params }) {
	setHeaders({
		'cache-control': 'max-age=240'
	});

	// If its a regular Page, we can just return the props
	if (isNaN(Number(params.show_number_or_title))) {
		const title = params.show_number_or_title;
		return {
			show: {
				isPage: true,
				title,
				number: 0,
				slug: ''
			}
		};
	}
	const show_number = parseInt(params.show_number_or_title);
	// If its a Show, we need to return the show from the DB
	const { include } = SHOW_QUERY();
	return {
		show: await prisma_client.show.findUnique({
			where: {
				number: show_number
			},
			include
		})
	};
};
