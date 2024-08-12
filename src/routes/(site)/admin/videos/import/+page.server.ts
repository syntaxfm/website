import { prisma_client } from '$/hooks.server';
import { get_remote_playlists, import_playlist } from '$/server/video/youtube_api';
import { fail } from '@sveltejs/kit';

export const load = async () => {
	const playlists = await prisma_client.remotePlaylist.findMany({
		orderBy: {
			created_at: 'desc'
		}
	});
	const local_playlists = await prisma_client.playlist.findMany({
		orderBy: {
			created_at: 'desc'
		},
		select: {
			id: true
		}
	});

	const playlist_ids = local_playlists.map((playlist) => playlist.id);
	return {
		playlists,
		local_playlists: playlist_ids
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
	},
	async import_playlist({ locals }) {
		try {
			await import_playlist(locals.form_data.playlist_id as string);
			return {
				message: 'Imported Playlist amd Videos'
			};
		} catch (error) {
			console.error(error);
			return fail(400, {
				message: 'Import/Sync Failed'
			});
		}
	}
};
