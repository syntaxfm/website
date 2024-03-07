import { YOUTUBE_CHANNEL_ID } from '$/const';
import { prisma_client } from '$/hooks.server';
import { YOUTUBE_API_KEY } from '$env/static/private';

export async function get_remote_playlists(): Promise<void> {
	const base_url = 'https://www.googleapis.com/youtube/v3/playlists';
	const params = new URLSearchParams({
		part: 'snippet,contentDetails',
		channelId: YOUTUBE_CHANNEL_ID,
		maxResults: '50',
		key: YOUTUBE_API_KEY
	});

	let next_page_token: string | null = null;

	do {
		if (next_page_token) {
			params.set('pageToken', next_page_token);
		}

		try {
			const response = await fetch(`${base_url}?${params}`);
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			const data = await response.json();

			for (const playlist of data.items) {
				await prisma_client.remotePlaylist.upsert({
					where: { playlist_id: playlist.id },
					update: {
						title: playlist.snippet.title,
						videos_count: playlist.contentDetails.itemCount,
						created_at: new Date(playlist.snippet.publishedAt)
					},
					create: {
						playlist_id: playlist.id,
						title: playlist.snippet.title,
						videos_count: playlist.contentDetails.itemCount,
						created_at: new Date(playlist.snippet.publishedAt)
					}
				});
			}

			next_page_token = data.nextPageToken || null;
		} catch (error) {
			console.error(`Error fetching playlists or updating database: ${error}`);
			break;
		}
	} while (next_page_token);

	console.log('Playlists imported and updated successfully.');
}
