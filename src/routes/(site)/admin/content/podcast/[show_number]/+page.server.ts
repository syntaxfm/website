import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$server/db/client';
import { show, aiShowNote } from '$server/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { syncEpisodeSpotifyData, type MegaphoneCredentials } from '$server/megaphone/sync';

type AiShowNoteUpdate = {
	title: string;
	description: string;
};

export const actions = {
	update_ai_show_note: async ({ locals, params }) => {
		const data = locals.form_data as AiShowNoteUpdate;
		if (!data.title.trim()) {
			return fail(400, { message: 'AI title cannot be empty.' });
		}
		if (!data.description.trim()) {
			return fail(400, { message: 'AI description cannot be empty.' });
		}

		const show_number = parseInt(params.show_number);
		await db
			.update(aiShowNote)
			.set({
				title: data.title,
				description: data.description
			})
			.where(eq(aiShowNote.show_number, show_number));

		return { success: true };
	},
	sync_spotify: async ({ params }) => {
		try {
			const show_number = parseInt(params.show_number);

			// Validate required environment variables
			if (!env.MEGAPHONE_API_TOKEN || !env.MEGAPHONE_NETWORK_ID || !env.MEGAPHONE_PODCAST_ID) {
				return fail(500, {
					message:
						'Missing required Megaphone environment variables. Check MEGAPHONE_API_TOKEN, MEGAPHONE_NETWORK_ID, and MEGAPHONE_PODCAST_ID.'
				});
			}

			// Create credentials object
			const credentials: MegaphoneCredentials = {
				apiToken: env.MEGAPHONE_API_TOKEN,
				networkId: env.MEGAPHONE_NETWORK_ID,
				podcastId: env.MEGAPHONE_PODCAST_ID
			};

			// Call the sync function for this specific episode
			await syncEpisodeSpotifyData(show_number, credentials);

			return {
				success: true,
				message:
					'Spotify sync completed successfully! Check the spotify_id field in the DB dump above.'
			};
		} catch (error) {
			return fail(500, {
				message: `Error syncing Spotify data: ${error instanceof Error ? error.message : 'Unknown error'}`
			});
		}
	}
} satisfies Actions;

export const load = async ({ params }) => {
	return {
		show: await db.query.show.findFirst({
			where: eq(show.number, parseInt(params.show_number)),
			with: {
				aiShowNote: {
					with: {
						links: true,
						summary: true,
						topics: true,
						tweets: true
					}
				},
				guests: true
			}
		})
	};
};
