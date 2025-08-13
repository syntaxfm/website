import type { AiShowNote } from '@prisma/client';
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { cache } from '$/server/cache/cache';
import { prisma_client } from '$/server/prisma-client';
import { env } from '$env/dynamic/private';
import { syncEpisodeSpotifyData, type MegaphoneCredentials } from '$/server/megaphone/sync';

type AiShowNoteUpdate = Pick<AiShowNote, 'title' | 'description'>;

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
		await prisma_client.aiShowNote.update({
			where: {
				show_number
			},
			data: {
				title: data.title,
				description: data.description
			}
		});

		await cache.shows.drop_show_cache(show_number);

		return { success: true };
	},
	sync_spotify: async ({ params }) => {
		try {
			const show_number = parseInt(params.show_number);

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
			return {
				success: false,
				message: `Error syncing Spotify data: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		}
	}
} satisfies Actions;

export const load: PageServerLoad = async ({ params }) => {
	return {
		show: await prisma_client.show.findUnique({
			where: {
				number: parseInt(params.show_number)
			},
			include: {
				aiShowNote: {
					include: {
						links: true,
						summary: true,
						topics: true,
						tweets: true
					}
				},
				// transcript: transcript_select,
				guests: true
			}
		})
	};
};
