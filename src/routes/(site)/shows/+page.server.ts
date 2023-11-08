import { PER_PAGE } from '$const';
// import { cache } from '$lib/cache/cache';
import { SHOW_QUERY } from '$server/ai/queries';
import { $Enums } from '@prisma/client';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { count_shows } from '$server/shows/count_shows';

export const load: PageServerLoad = async function ({ locals, url, setHeaders }) {
	setHeaders({
		'cache-control': 'max-age=240'
	});

	const order_val = url.searchParams.get('order');
	const take = parseInt(url.searchParams.get('perPage') || PER_PAGE.toString());
	const order = order_val === 'desc' || !order_val ? 'desc' : 'asc'; // Ensure order can only be 'asc' or 'desc'
	const show_type = url.searchParams.get('type')?.toUpperCase();
	const page = parseInt(url.searchParams.get('page') || '1');
	// const limit = url.searchParams.get('limit') || 100;

	function isShowType(type: string | null | undefined): type is $Enums.ShowType {
		if (!type) return false;
		return $Enums.ShowType.hasOwnProperty(type);
	}

	const query = SHOW_QUERY({
		take,
		order,
		skip: page ? page * take - take : 0,
		show_type: isShowType(show_type) ? show_type : undefined
	});

	const shows = await locals.prisma.show.findMany(query);

	if (!shows.length) {
		// If there are no shows for this page, redirect them to the first page but keep their query params. This happens when someone changes the perPage value and that makes their page no longer have anything to show.
		console.log(`No shows on this page, redirecting to page 1`);
		const params = new URLSearchParams(url.searchParams);
		params.delete('page');
		throw redirect(302, `/shows?${params.toString()}`);
	}

	return {
		shows,
		// Todo: This needs to include where clause when we get hasty/tasty/supper/special filtering
		// https://github.com/prisma/prisma/discussions/3087#discussioncomment-6857217
		count: count_shows()
	};

	// let whereClause = '';
	// const params = [];

	// if (filter) {
	// 	switch (filter) {
	// 		case 'hasty':
	// 			whereClause += 'DAYOFWEEK(date) = ?';
	// 			params.push(2); // Monday
	// 			break;
	// 		case 'tasty':
	// 			whereClause += 'DAYOFWEEK(date) = ?';
	// 			params.push(4); // Wednesday
	// 			break;
	// 		case 'supper':
	// 			whereClause += 'DAYOFWEEK(date) = ?';
	// 			params.push(6); // Friday
	// 			break;
	// 		case 'special':
	// 			whereClause += 'DAYOFWEEK(date) NOT IN (?, ?, ?)';
	// 			params.push(2, 4, 6); // Not Monday, Wednesday, or Friday
	// 			break;
	// 	}
	// }

	// const cache_key = `shows:${epoch_day}:${filter}:${order}:${limit}`;

	// let sqlQuery = 'SELECT id, number, title, date, slug, url FROM `Show`';
	// if (whereClause !== '') {
	// 	sqlQuery += ` WHERE ${whereClause}`;
	// }
	// sqlQuery += ` ORDER BY number ${order} LIMIT ${limit}`;
	// let shows = await cache.get(cache_key);

	// if (!shows) {
	// 	shows = await locals.prisma.$queryRawUnsafe(sqlQuery, ...params);
	// 	cache.set(cache_key, shows);
	// }

	// return {
	// 	shows
	// };
};
