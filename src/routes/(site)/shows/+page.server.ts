import { PER_PAGE } from '$const';
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

	function isShowType(type: string | null | undefined): type is $Enums.ShowType {
		if (!type) return false;
		return Object.prototype.hasOwnProperty.call($Enums.ShowType, type);
	}

	const query = SHOW_QUERY({
		take,
		order,
		skip: page ? page * take - take : 0,
		show_type: isShowType(show_type) ? show_type : undefined
	});

	const [shows, total_show_count] = await Promise.all([
		locals.prisma.show.findMany(query),
		count_shows()
	]);

	if (!shows.length) {
		// If there are no shows for this page, redirect them to the first page but keep their query params. This happens when someone changes the perPage value and that makes their page no longer have anything to show.
		console.log(`No shows on this page, redirecting to page 1`);
		const params = new URLSearchParams(url.searchParams);
		params.delete('page');
		const params_string = params.toString();
		if (params_string.length <= 0) {
			console.log(`No params for this page redirect. Abort to the homepage!`);
			redirect(302, `/`);
		}
		redirect(302, `/shows?${params_string}`);
	}

	return {
		shows,
		count: total_show_count,
		meta: {
			title: `Syntax Podcast Shows ${page > 1 ? `- Page ${page}` : ''}`,
			canonical: `${url.protocol}//${url.host}${url.pathname}${page > 1 ? `?page=${page}` : ''}`
		}
	};
};
