/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url }) {
	const order = url.searchParams.get('order') || 'desc';
	return {
		shows: locals.prisma.show.findMany({ orderBy: { number: order }, take: 20 })
	};
}
