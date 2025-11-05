export const load = async function ({ url, setHeaders }) {
	setHeaders({
		'cache-control': 'max-age=240'
	});

	return {};
};
