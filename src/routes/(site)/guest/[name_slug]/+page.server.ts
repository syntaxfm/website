export const load = async function ({ locals, params }) {
	return {
		guest: locals.prisma.guest.findUnique({
			where: {
				name_slug: params.name_slug
			},
			include: {
				shows: {
					orderBy: {
						showId: 'desc'
					},
					select: {
						Show: {
							include: {
								guests: {
									select: {
										Guest: {
											select: {
												name: true,
												name_slug: true,
												id: true,
												github: true
											}
										}
									}
								}
							}
						}
					}
				}
			}
		})
	};
};
