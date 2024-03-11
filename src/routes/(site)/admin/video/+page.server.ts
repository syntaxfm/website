export const load = async ({ locals }) => {
	const local_playlists = await locals.prisma.playlist.findMany({
		orderBy: {
			created_at: 'desc'
		}
	});
	return {
		local_playlists
	};
};
