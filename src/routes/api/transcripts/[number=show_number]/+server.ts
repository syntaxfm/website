import { error, json } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';
import { db } from '$server/db/client';
import { getSlimUtterances } from '$server/transcripts/utils';

export async function GET({ params }) {
	const show_number = parseInt(params.number);

	const transcript = await db.query.transcript.findFirst({
		where: (transcript, { eq }) => eq(transcript.show_number, show_number),
		with: {
			show: {
				columns: {
					title: true,
					number: true,
					date: true
				}
			},
			utterances: {
				columns: {
					speaker: true,
					transcript_value: true,
					start: true,
					end: true
				},
				orderBy: (utterance) => [asc(utterance.start)]
			}
		}
	});

	if (!transcript || !transcript.show) {
		error(404, 'Transcript not found');
	}

	const grouped_utterances = getSlimUtterances(transcript.utterances, show_number);

	return json(
		{
			show_title: transcript.show.title,
			show_number: transcript.show.number,
			utterances: grouped_utterances.map((utterance) => ({
				speaker: utterance.speakerId,
				speaker_name: utterance.speakerName,
				transcript: utterance.transcript,
				start: utterance.start,
				end: utterance.end
			}))
		},
		{
			headers: {
				'Access-Control-Allow-Origin': '*'
			}
		}
	);
}
