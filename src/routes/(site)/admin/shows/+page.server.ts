import { import_or_update_all_changed_shows, import_or_update_all_shows } from '$server/shows';
import { error } from '@sveltejs/kit';
import { get_transcript } from '$server/transcripts/deepgram';
import { aiNoteRequestHandler } from '$server/ai/requestHandlers';
import {
	syncAllEpisodesSpotifyData,
	syncEpisodeSpotifyData,
	type MegaphoneCredentials
} from '$server/megaphone/sync';
import { db } from '$server/db/client';
import {
	show,
	showGuest,
	transcriptUtteranceWord,
	transcriptUtterance,
	transcript,
	aiShowNote,
	socialLink,
	guest
} from '$server/db/schema';
import { env } from '$env/dynamic/private';
import { desc, eq, sql } from 'drizzle-orm';

export const config = {
	maxDuration: 300 // vercel timeout
};

// Helper function to sync Spotify data for specific shows
// async function syncShowsSpotifyData(showNumbers: number[]): Promise<void> {
// 	const credentials: MegaphoneCredentials = {
// 		apiToken: env.MEGAPHONE_API_TOKEN,
// 		networkId: env.MEGAPHONE_NETWORK_ID,
// 		podcastId: env.MEGAPHONE_PODCAST_ID
// 	};

// 	for (const showNumber of showNumbers) {
// 		try {
// 			await syncEpisodeSpotifyData(showNumber, credentials);
// 		} catch (error) {
// 			console.error(`🎵 Failed to sync Spotify data for show ${showNumber}:`, error);
// 		}
// 	}
// }

export const actions = {
	import_all_shows: async () => {
		console.log('🤖 Pod Sync Requested via Admin');
		const result = await import_or_update_all_changed_shows();

		if (result.updatedShows && result.updatedshow.length > 0) {
			try {
				await syncShowsSpotifyData(result.updatedShows);
			} catch (error) {
				console.error('🎵 Spotify sync failed:', error);
			}
		}

		return result;
	},
	refresh_all: async () => {
		console.log('🤖 Pod Refresh Requested via Admin');
		const result = await import_or_update_all_shows();

		try {
			const credentials: MegaphoneCredentials = {
				apiToken: env.MEGAPHONE_API_TOKEN,
				networkId: env.MEGAPHONE_NETWORK_ID,
				podcastId: env.MEGAPHONE_PODCAST_ID
			};
			await syncAllEpisodesSpotifyData(credentials);
		} catch (error) {
			console.error('🎵 Spotify sync failed:', error);
		}

		return result;
	},

	delete_all_shows: async () => {
		// Order of these is important because of how db relations work
		await db.delete(showGuest);
		await db.delete(transcriptUtteranceWord);
		await db.delete(transcriptUtterance);
		await db.delete(transcript);
		await db.delete(aiShowNote);
		await db.delete(show);
		await db.delete(socialLink);
		await db.delete(guest);
		return { message: 'Delete All Shows' };
	},
	delete_transcript: async ({ locals }) => {
		const show_number = parseInt(locals.form_data.show_number?.toString() || '');
		if (!show_number) {
			error(400, 'Invalid Show Number');
		}
		await db.delete(transcript).where(eq(transcript.show_number, show_number));
		return { message: `Deleted Transcript for Show ${show_number}` };
	},
	fetch_show_transcript: async ({ locals }) => {
		const show_number = parseInt(locals.form_data.show_number?.toString() || '');
		if (!show_number) {
			error(400, 'Invalid Show Number');
		}
		await get_transcript(show_number);
		console.log('🤖 transcript fetch requested');
		return { message: 'Transcript Fetch Requested' };
	},
	fetch_AI_notes: aiNoteRequestHandler
};
