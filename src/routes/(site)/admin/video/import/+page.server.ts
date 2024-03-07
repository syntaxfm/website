import { get_remote_playlists } from '$/server/video/youtube_api';
import { fail } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const playlists = await locals.prisma.remotePlaylist.findMany({});
	return {
		playlists
	};
};

export const actions = {
	async import() {
		try {
			await get_remote_playlists();
			return {
				message: 'Imported Playlists'
			};
		} catch (error) {
			console.error(error);
			return fail(400, {
				message: 'Import/Sync Failed'
			});
		}
	}
};
