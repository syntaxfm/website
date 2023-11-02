import type { PageServerLoad } from './$types';
// import env from svelte kit environment
import { env } from '$env/dynamic/private';

const pr = new Intl.PluralRules('en-US', { type: 'ordinal' });
const numberformatter = new Intl.NumberFormat('en-US');

const suffixes = new Map([
	['one', 'st'],
	['two', 'nd'],
	['few', 'rd'],
	['other', 'th']
]);

function formatNumber(n: number) {
	const rule = pr.select(n); // 'one', 'two', 'few', 'other'
	const suffix = suffixes.get(rule);
	return `${numberformatter.format(n)}${suffix}`;
}

export const load: PageServerLoad = async function ({ setHeaders, params, locals }) {
	// 3 min cache with 1 min stale allowed
	setHeaders({
		'cache-control': `public s-max-age=240, stale-while-revalidate=60`
	});
	const subs = await fetch(
		`https://api.convertkit.com/v3/subscribers?api_secret=${env.CONVERT_KIT_SECRET}`
	)
		.then((res) => res.json())
		.catch(console.error);

	const count =
		typeof subs?.total_subscribers === 'number' ? formatNumber(subs.total_subscribers) : '';
	return {
		count
	};
};
