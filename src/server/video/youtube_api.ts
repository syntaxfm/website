import { YOUTUBE_CHANNEL_ID } from '$/const';
import { prisma_client } from '$/hooks.server';
import { YOUTUBE_API_KEY } from '$env/static/private';
import slug from 'speakingurl';

// Youtube importer
// Important things to know -> Youtube is the source of truth for all the data
// If you want to update something, update it on youtube and manually re-sync or wait for the auto sync to run

// To link a video it needs a tag on youtube as syntax-shownumber
// To relate a video to a show it needs a tag on youtube as syntax-related-shownumber

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

			// Iterate over all the playlists to upsert them
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

export async function import_playlist(playlist_id: string) {
	// Yo, let's grab that playlist data from the YouTube API!
	const playlist_response = await fetch(
		`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlist_id}&key=${process.env.YOUTUBE_API_KEY}`
	);
	const playlist_data = await playlist_response.json();

	// Upsert that playlist like a boss!
	const playlist = await prisma_client.playlist.upsert({
		where: { id: playlist_id },
		update: {
			title: playlist_data.items[0].snippet.title,
			description: playlist_data.items[0].snippet.description,
			slug: slug(playlist_data.items[0].snippet.title)
		},
		create: {
			id: playlist_id,
			title: playlist_data.items[0].snippet.title,
			description: playlist_data.items[0].snippet.description,
			slug: slug(playlist_data.items[0].snippet.title)
		}
	});

	let video_ids: string[] = [];
	let next_page_token: string | undefined = undefined;
	let videos: any[] = [];

	do {
		// Time to fetch those video details, page by page!
		const video_response = await fetch(
			`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlist_id}&key=${process.env.YOUTUBE_API_KEY}&maxResults=50${
				next_page_token ? `&pageToken=${next_page_token}` : ''
			}`
		);
		const video_data = await video_response.json();

		// Extract the video IDs from the playlist items
		video_ids = [
			...video_ids,
			...video_data.items.map((item: any) => item.snippet.resourceId.videoId)
		];

		// Store the playlist items for later use
		videos = [...videos, ...video_data.items];

		next_page_token = video_data.nextPageToken;
	} while (next_page_token);

	// Fetch video details using the videos endpoint
	const videos_response = await fetch(
		`https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${video_ids.join(',')}&key=${process.env.YOUTUBE_API_KEY}`
	);
	const videos_data = await videos_response.json();

	// Process the video details
	for (const item of videos_data.items) {
		if (item.status.privacyStatus === 'private') {
			console.log(`Skipping private video: ${item.snippet.title}`);
			continue;
		}

		try {
			const video = await prisma_client.video.upsert({
				where: { id: item.id },
				update: {
					title: item.snippet.title,
					slug: slug(item.snippet.title),
					description: item.snippet.description,
					url: `https://www.youtube.com/watch?v=${item.id}`,
					published_at: new Date(item.snippet.publishedAt),
					thumbnail: item.snippet.thumbnails.maxres.url
				},
				create: {
					id: item.id,
					title: item.snippet.title,
					slug: slug(item.snippet.title),
					description: item.snippet.description,
					url: `https://www.youtube.com/watch?v=${item.id}`,
					published_at: new Date(item.snippet.publishedAt),
					thumbnail: item.snippet.thumbnails.maxres.url
				}
			});

			// Find the corresponding playlist item to get the position
			const playlistItem = videos.find((i: any) => i.snippet.resourceId.videoId === item.id);

			await prisma_client.playlistOnVideo.upsert({
				where: {
					video_id_playlist_id: {
						video_id: video.id,
						playlist_id: playlist.id
					}
				},
				update: {
					video_id: video.id
				},
				create: {
					video_id: video.id,
					playlist_id: playlist.id,
					order: playlistItem.snippet.position
				}
			});
			console.log('item.snippet.tags', item.snippet.tags);
			// Check for "syntax-shownumber" tags and connect to the corresponding shows
			const syntaxShowNumberTags = item.snippet.tags?.filter((tag: string) =>
				/^syntax-related-\d+$/.test(tag)
			);
			console.log('syntaxShowNumberTags', syntaxShowNumberTags);

			if (syntaxShowNumberTags) {
				for (const tag of syntaxShowNumberTags) {
					const showNumber = parseInt(tag.split('-')[2]);
					console.log('showNumber', showNumber);
					const show = await prisma_client.show.findUnique({
						where: { number: showNumber }
					});

					if (show) {
						await prisma_client.showVideo.upsert({
							where: {
								showId_videoId: {
									showId: show.id,
									videoId: video.id
								}
							},
							update: {},
							create: {
								showId: show.id,
								videoId: video.id
							}
						});
					}
				}
			}
		} catch (error) {
			console.error(`Error processing video ${item.id}:`, error);
			throw error;
		}
	}

	// Clean up those old relationships for videos that got kicked out of the playlist!
	const playlist_video_ids = (
		await prisma_client.playlistOnVideo.findMany({
			where: { playlist_id },
			select: { video_id: true }
		})
	).map((item) => item.video_id);

	await prisma_client.playlistOnVideo.deleteMany({
		where: {
			playlist_id,
			video_id: {
				notIn: playlist_video_ids
			}
		}
	});
}
