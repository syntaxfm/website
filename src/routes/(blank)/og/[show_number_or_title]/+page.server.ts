import { db } from '$server/db/client';

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
		show: await db.query.shows.findFirst({
			where: (shows, { eq }) => eq(shows.number, show_number)
		})
	};
};
