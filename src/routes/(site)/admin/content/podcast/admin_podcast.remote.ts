import { form, query } from '$app/server';
import { env } from '$env/dynamic/private';
import { db } from '$server/db/client';
import {
	aiShowNote,
	guest,
	show,
	showGuest,
	socialLink,
	transcript,
	transcriptUtterance,
	transcriptUtteranceWord
} from '$server/db/schema';
import {
	syncAllEpisodesSpotifyData,
	syncEpisodeSpotifyData,
	type MegaphoneCredentials
} from '$server/megaphone/sync';
import * as v from 'valibot';
import { import_or_update_all_changed_shows, import_or_update_all_shows } from '$server/shows';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { get_transcript } from '$server/transcripts/deepgram';
import { generate_ai_notes } from '$server/ai/openai';
import { save_ai_notes_to_db } from '$server/ai/db';

// Helper function to sync Spotify data for specific shows
async function syncShowsSpotifyData(showNumbers: number[]): Promise<void> {
	const credentials: MegaphoneCredentials = {
		apiToken: env.MEGAPHONE_API_TOKEN as string,
		networkId: env.MEGAPHONE_NETWORK_ID as string,
		podcastId: env.MEGAPHONE_PODCAST_ID as string
	};

	for (const showNumber of showNumbers) {
		try {
			await syncEpisodeSpotifyData(showNumber, credentials);
		} catch (error) {
			console.error(`🎵 Failed to sync Spotify data for show ${showNumber}:`, error);
		}
	}
}

export const get_all_shows = query(async () => {
	return db.query.show.findMany({
		orderBy: (content, { desc }) => [desc(content.number)],
		with: {
			meta: true,
			guests: true,
			aiShowNote: {
				columns: {
					id: true
				}
			},
			transcript: {
				columns: {
					id: true
				}
			}
		}
	});
});

export const import_all_shows = form(async () => {
	console.log('🤖 Pod Sync Requested via Admin');
	const result = await import_or_update_all_changed_shows();

	if (result.updatedShows && result.updatedShows.length > 0) {
		try {
			await syncShowsSpotifyData(result.updatedShows);
		} catch (error) {
			console.error('🎵 Spotify sync failed:', error);
		}
	}

	console.log(result);
	return result;
});

export const refresh_all = form(async () => {
	console.log('🤖 Pod Refresh Requested via Admin');
	const result = await import_or_update_all_shows();

	try {
		const credentials: MegaphoneCredentials = {
			apiToken: env.MEGAPHONE_API_TOKEN as string,
			networkId: env.MEGAPHONE_NETWORK_ID as string,
			podcastId: env.MEGAPHONE_PODCAST_ID as string
		};
		await syncAllEpisodesSpotifyData(credentials);
	} catch (error) {
		console.error('🎵 Spotify sync failed:', error);
	}

	return result;
});

export const delete_all_shows = form(async () => {
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
});

export const delete_transcript = form(
	v.object({
		show_number: v.number()
	}),
	async ({ show_number }) => {
		await db.delete(transcript).where(eq(transcript.show_number, show_number));
		return { message: `Deleted Transcript for Show ${show_number}` };
	}
);

export const fetch_show_transcript = form(
	v.object({
		show_number: v.number()
	}),
	async ({ show_number }) => {
		await get_transcript(show_number);
		console.log('🤖 transcript fetch requested');
		return { message: 'Transcript Fetch Requested' };
	}
);

// fetch_AI_notes: aiNoteRequestHandler
export const fetch_AI_notes = form(
	v.object({
		show_number: v.number()
	}),
	async ({ show_number }) => {
		const current_show = await db.query.show.findFirst({
			where: eq(show.number, show_number),
			with: {
				transcript: {
					with: {
						utterances: {
							columns: {
								id: true,
								start: true,
								end: true,
								confidence: true,
								channel: true,
								transcript_value: true,
								speaker: true,
								speakerName: true,
								transcriptId: true
							},
							orderBy: (utterances, { asc }) => [asc(utterances.start)]
						}
					}
				}
			}
		});

		if (!current_show?.transcript) {
			error(400, 'No show, or no transcript for this show');
		}

		// delete any existing ai notes
		await db.delete(aiShowNote).where(eq(aiShowNote.show_number, show_number));

		// Get the AI transcript for this show
		const result = await generate_ai_notes(current_show);
		// Save to DB
		console.log(`🤖 Saving AI Notes to DB for Show ${show_number}`);
		console.dir(result);
		await save_ai_notes_to_db(result, current_show);

		return { message: 'AI Notes Created' };
	}
);
