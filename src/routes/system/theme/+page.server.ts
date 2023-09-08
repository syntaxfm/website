export const load = async ({ locals, setHeaders }) => {
	setHeaders({
		'cache-control': 'max-age=240'
	});
	return {
		show: locals.prisma.show.findFirst({ orderBy: { number: 'desc' } })
	};
};
