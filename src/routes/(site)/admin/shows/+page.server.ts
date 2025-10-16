import { import_or_update_all_changed_shows, import_or_update_all_shows } from '$server/shows';
import { error } from '@sveltejs/kit';
import { get_transcript } from '$server/transcripts/deepgram';
import { aiNoteRequestHandler } from '$server/ai/requestHandlers';
import {
	syncAllEpisodesSpotifyData,
	syncEpisodeSpotifyData,
	type MegaphoneCredentials
} from '$server/megaphone/sync';
import type { PageServerLoad } from './$types';
import { prisma_client } from '$/server/prisma-client';
import { env } from '$env/dynamic/private';

export const config = {
	maxDuration: 300 // vercel timeout
};

// Helper function to sync Spotify data for specific shows
async function syncShowsSpotifyData(showNumbers: number[]): Promise<void> {
	const credentials: MegaphoneCredentials = {
		apiToken: env.MEGAPHONE_API_TOKEN,
		networkId: env.MEGAPHONE_NETWORK_ID,
		podcastId: env.MEGAPHONE_PODCAST_ID
	};

	for (const showNumber of showNumbers) {
		try {
			await syncEpisodeSpotifyData(showNumber, credentials);
		} catch (error) {
			console.error(`🎵 Failed to sync Spotify data for show ${showNumber}:`, error);
		}
	}
}

export const load: PageServerLoad = async () => {
	return {
		shows: await prisma_client.show.findMany({
			orderBy: { number: 'desc' },
			include: {
				aiShowNote: {
					select: {
						id: true
					}
				},
				transcript: {
					select: {
						id: true
					}
				},
				_count: {
					select: {
						guests: true
					}
				}
			}
		})
	};
};

export const actions = {
	import_all_shows: async () => {
		console.log('🤖 Pod Sync Requested via Admin');
		const result = await import_or_update_all_changed_shows();

		if (result.updatedShows && result.updatedShows.length > 0) {
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
		await prisma_client.showGuest.deleteMany({});
		await prisma_client.transcriptUtteranceWord.deleteMany({});
		await prisma_client.transcriptUtterance.deleteMany({});
		await prisma_client.transcript.deleteMany({});
		await prisma_client.aiShowNote.deleteMany({});
		await prisma_client.show.deleteMany({});
		await prisma_client.socialLink.deleteMany({});
		await prisma_client.guest.deleteMany({});
		return { message: 'Delete All Shows' };
	},
	delete_transcript: async ({ locals }) => {
		const show_number = parseInt(locals.form_data.show_number?.toString() || '');
		if (!show_number) {
			error(400, 'Invalid Show Number');
		}
		await prisma_client.transcript.delete({
			where: {
				show_number
			}
		});
		return { message: `Deleted Transcript for Show ${show_number}` };
	},
	fetch_show_transcript: async ({ locals }) => {
		const show_number = parseInt(locals.form_data.show_number?.toString() || '');
		if (!show_number) {
			error(400, 'Invalid Show Number');
		}
		await get_transcript(show_number);
		console.log('🤖 transcript fetch requested');
		return { message: 'Transcript Fetch Requestd' };
	},
	fetch_AI_notes: aiNoteRequestHandler
};
