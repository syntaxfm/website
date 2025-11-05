import { error, type RequestEvent } from '@sveltejs/kit';
import { generate_ai_notes } from './openai';
import { save_ai_notes_to_db } from './db';
import { db } from '$server/db/client';
import { shows, aiShowNotes } from '$server/db/schema';
import { eq } from 'drizzle-orm';

export async function aiNoteRequestHandler({ locals }: RequestEvent) {
	const show_number = parseInt(locals.form_data.show_number?.toString() || '');

	if (!show_number) {
		error(400, 'Invalid Show Number');
	}

	const show = await db.query.shows.findFirst({
		where: eq(shows.number, show_number),
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

	if (!show?.transcript) {
		error(400, 'No show, or no transcript for this show');
	}

	// delete any existing ai notes
	await db.delete(aiShowNotes).where(eq(aiShowNotes.show_number, show_number));

	// Get the AI transcript for this show
	const result = await generate_ai_notes(show);
	// Save to DB
	console.log(`🤖 Saving AI Notes to DB for Show ${show_number}`);
	console.dir(result);
	await save_ai_notes_to_db(result, show);

	return { message: 'AI Notes Created' };
}
