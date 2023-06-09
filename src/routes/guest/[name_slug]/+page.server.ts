export const load = async function ({ locals, params }) {
	return {
		guest: locals.prisma.guest.findUnique({
			where: {
				name_slug: params.name_slug
			},
			include: {
				show: true
			}
		})
	};
};
