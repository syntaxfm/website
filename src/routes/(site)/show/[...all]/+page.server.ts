import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async function ({ params, locals, setHeaders }) {
	setHeaders({
		'cache-control': 'max-age=240'
	});

	const { all } = params;
	throw redirect(302, `/shows/${all}`);
};
