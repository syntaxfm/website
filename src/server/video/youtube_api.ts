import { YOUTUBE_CHANNEL_ID } from '$const';
import { db } from '$server/db/client';

import slug from 'speakingurl';
import { eq, and, notInArray } from 'drizzle-orm';
import {
	playlist,
	playlistOnVideo,
	remotePlaylist,
	show,
	showVideo,
	video
} from '$server/db/schema';
import { env } from '$env/dynamic/private';

// Youtube importer
// Important things to know -> Youtube is the source of truth for all the data
// If you want to update something, update it on youtube and manually re-sync or wait for the auto sync to run

// To link a video it needs a tag on youtube as syntax-shownumber
// To relate a video to a show it needs a tag on youtube as syntax-related-shownumber

interface YouTubePlaylist {
	id: string;
	snippet: {
		title: string;
		description: string;
		publishedAt: string;
	};
	contentDetails: {
		itemCount: number;
	};
}

interface YouTubePlaylistResponse {
	items: YouTubePlaylist[];
	nextPageToken?: string;
}

interface YouTubePlaylistItem {
	snippet: {
		publishedAt: string;
		title: string;
		description: string;
		thumbnails: {
			maxres: {
				url: string;
			};
		};
		resourceId: {
			videoId: string;
		};
		position: number;
	};
}

interface YouTubePlaylistItemResponse {
	items: YouTubePlaylistItem[];
	nextPageToken?: string;
}

export async function get_youtube_playlists(): Promise<void> {
	const base_url = 'https://www.googleapis.com/youtube/v3/playlists';
	const params = new URLSearchParams({
		part: 'snippet,contentDetails',
		channelId: YOUTUBE_CHANNEL_ID,
		maxResults: '50',
		key: env.YOUTUBE_API_KEY
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
			const data: YouTubePlaylistResponse = await response.json();

			// Iterate over all the playlists to upsert them
			for (const playlist_item of data.items) {
				await db
					.insert(remotePlaylist)
					.values({
						playlist_id: playlist_item.id,
						title: playlist_item.snippet.title,
						videos_count: playlist_item.contentDetails.itemCount,
						created_at: new Date(playlist_item.snippet.publishedAt)
					})
					.onConflictDoUpdate({
						target: remotePlaylist.playlist_id,
						set: {
							title: playlist_item.snippet.title,
							videos_count: playlist_item.contentDetails.itemCount,
							created_at: new Date(playlist_item.snippet.publishedAt)
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

export async function import_youtube_playlist(playlist_id: string) {
	// Yo, let's grab that playlist data from the YouTube API!
	const playlist_response = await fetch(
		`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlist_id}&key=${env.YOUTUBE_API_KEY}`
	);

	if (!playlist_response.ok) {
		throw new Error(
			`Failed to fetch playlist: ${playlist_response.status} ${playlist_response.statusText}`
		);
	}

	const playlist_data: YouTubePlaylistResponse = await playlist_response.json();

	if (!playlist_data.items || playlist_data.items.length === 0) {
		throw new Error(`No playlist found with ID: ${playlist_id}`);
	}

	console.log(playlist_data);
	// Upsert that playlist like a boss!
	await db
		.insert(playlist)
		.values({
			id: playlist_id,
			title: playlist_data.items[0].snippet.title,
			description: playlist_data.items[0].snippet.description,
			slug: slug(playlist_data.items[0].snippet.title)
		})
		.onConflictDoUpdate({
			target: playlist.id,
			set: {
				title: playlist_data.items[0].snippet.title,
				description: playlist_data.items[0].snippet.description,
				slug: slug(playlist_data.items[0].snippet.title)
			}
		});

	let video_ids: string[] = [];
	let next_page_token: string | undefined = undefined;
	let playlist_items: YouTubePlaylistItem[] = [];

	do {
		// Time to fetch those video details, page by page!
		const video_response = await fetch(
			`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlist_id}&key=${env.YOUTUBE_API_KEY}&maxResults=50${
				next_page_token ? `&pageToken=${next_page_token}` : ''
			}`
		);

		if (!video_response.ok) {
			throw new Error(
				`Failed to fetch playlist items: ${video_response.status} ${video_response.statusText}`
			);
		}

		const video_data: YouTubePlaylistItemResponse = await video_response.json();

		if (!video_data.items || video_data.items.length === 0) {
			console.log('No more items in playlist');
			break;
		}

		// Extract the video IDs from the playlist items
		video_ids = [...video_ids, ...video_data.items.map((item) => item.snippet.resourceId.videoId)];

		// Store the playlist items for later use
		playlist_items = [...playlist_items, ...video_data.items];

		next_page_token = video_data.nextPageToken;
	} while (next_page_token);

	if (video_ids.length === 0) {
		console.log('No videos found in playlist');
		return;
	}

	// Fetch video details using the videos endpoint
	const videos_response = await fetch(
		`https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${video_ids.join(',')}&key=${env.YOUTUBE_API_KEY}`
	);

	if (!videos_response.ok) {
		throw new Error(
			`Failed to fetch video details: ${videos_response.status} ${videos_response.statusText}`
		);
	}

	const videos_data = await videos_response.json();

	if (!videos_data.items || videos_data.items.length === 0) {
		console.log('No video details returned from API');
		return;
	}

	// Process the video details
	for (const item of videos_data.items) {
		if (item.status.privacyStatus === 'private') {
			console.log(`Skipping private video: ${item.snippet.title}`);
			continue;
		}

		try {
			await db
				.insert(video)
				.values({
					id: item.id,
					title: item.snippet.title,
					slug: slug(item.snippet.title),
					description: item.snippet.description,
					url: `https://www.youtube.com/watch?v=${item.id}`,
					published_at: new Date(item.snippet.publishedAt),
					thumbnail: item.snippet.thumbnails.maxres.url
				})
				.onConflictDoUpdate({
					target: video.id,
					set: {
						title: item.snippet.title,
						slug: slug(item.snippet.title),
						description: item.snippet.description,
						url: `https://www.youtube.com/watch?v=${item.id}`,
						published_at: new Date(item.snippet.publishedAt),
						thumbnail: item.snippet.thumbnails.maxres.url
					}
				});

			// Find the corresponding playlist item to get the position
			const playlistItem = playlist_items.find((i) => i.snippet.resourceId.videoId === item.id);

			await db
				.insert(playlistOnVideo)
				.values({
					video_id: item.id,
					playlist_id: playlist_id,
					order: playlistItem?.snippet.position || 0
				})
				.onConflictDoUpdate({
					target: [playlistOnVideo.video_id, playlistOnVideo.playlist_id],
					set: {
						order: playlistItem?.snippet.position || 0
					}
				});

			// Check for "syntax-shownumber" tags and connect to the corresponding shows
			const syntaxShowNumberTags = item.snippet.tags?.filter((tag: string) =>
				/^syntax-related-\d+$/.test(tag)
			);

			if (syntaxShowNumberTags) {
				for (const tag of syntaxShowNumberTags) {
					const showNumber = parseInt(tag.split('-')[2]);
					const current_show = await db.query.show.findFirst({
						where: eq(show.number, showNumber)
					});

					if (current_show) {
						await db
							.insert(showVideo)
							.values({
								showId: current_show.id,
								videoId: item.id
							})
							.onConflictDoUpdate({
								target: [showVideo.showId, showVideo.videoId],
								set: {
									showId: current_show.id
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
		await db.query.playlistOnVideo.findMany({
			where: eq(playlistOnVideo.playlist_id, playlist_id),
			columns: {
				video_id: true
			}
		})
	).map((item) => item.video_id);

	await db
		.delete(playlistOnVideo)
		.where(
			and(
				eq(playlistOnVideo.playlist_id, playlist_id),
				notInArray(playlistOnVideo.video_id, playlist_video_ids)
			)
		);
}
