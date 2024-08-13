import { import_or_update_all_changed_shows, import_or_update_all_shows } from '$server/shows';
import { error } from '@sveltejs/kit';
import { get_transcript } from '$server/transcripts/deepgram';
import { aiNoteRequestHandler } from '$server/ai/requestHandlers';
import type { PageServerLoad } from './$types';
import { prisma_client } from '$/server/prisma-client';

export const config = {
	maxDuration: 300 // vercel timeout
};

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
		return import_or_update_all_changed_shows();
	},
	refresh_all: async () => {
		console.log('🤖 Pod Refresh Requested via Admin');
		return import_or_update_all_shows();
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
	delete_transcript: async ({ request }) => {
		const data = await request.formData();
		const show_number = parseInt(data.get('show_number')?.toString() || '');
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
	fetch_show_transcript: async ({ request }) => {
		const data = await request.formData();
		const show_number = parseInt(data.get('show_number')?.toString() || '');
		if (!show_number) {
			error(400, 'Invalid Show Number');
		}
		const result = await get_transcript(show_number);
		console.log('🤖 transcript fetch requested');
		return { message: 'Transcript Fetch Requestd' };
	},
	fetch_AI_notes: aiNoteRequestHandler
};
