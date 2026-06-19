export const load = async function ({ setHeaders }) {
	setHeaders({
		'cache-control': 'max-age=240'
	});

	return {};
};
