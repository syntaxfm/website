import { import_or_update_all_shows } from '$server/shows';
import { error } from '@sveltejs/kit';
import { get_transcript } from '$server/transcripts/deepgram';
import { aiNoteRequestHandler } from '$server/ai/requestHandlers';

export const load = async ({ locals }) => {
	return {
		shows: locals.prisma.show.findMany({
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
		return import_or_update_all_shows();
	},

	delete_all_shows: async ({ locals }) => {
		// Order of these is important because of how db relations work
		await locals.prisma.showGuest.deleteMany({});
		await locals.prisma.show.deleteMany({});
		await locals.prisma.socialLink.deleteMany({});
		await locals.prisma.guest.deleteMany({});
		return { message: 'Delete All Shows' };
	},
	fetch_show_transcript: async ({ request }) => {
		const data = await request.formData();
		const show_number = parseInt(data.get('show_number')?.toString() || '');
		if (!show_number) {
			throw error(400, 'Invalid Show Number');
		}
		const result = await get_transcript(show_number);
		console.log('🤖 transcript fetch requested');
		return { message: 'Transcript Fetch Requestd' };
	},
	fetch_AI_notes: aiNoteRequestHandler
};
