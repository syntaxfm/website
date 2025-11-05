export const load = async function ({ setHeaders }) {
	// Cache for 3 days, stale for 1 hour OK
	setHeaders({
		'cache-control': `public, s-maxage=${60 * 60 * 24 * 3}, stale-while-revalidate=${60 * 60 * 1}`
	});

	return {};
};
