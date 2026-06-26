import { db } from '$server/db/client';
import { with_show_card_show } from '$server/shows/shows_queries';

export const load = async function ({ setHeaders, params }) {
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
	return {
		show: await db.query.show.findFirst({
			where: (show, { eq }) => eq(show.number, show_number),
			with: with_show_card_show
		})
	};
};
