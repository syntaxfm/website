import { error, json } from '@sveltejs/kit';
import { prisma_client } from '$/server/prisma-client';
import { getSlimUtterances } from '$/server/transcripts/utils';

export async function GET({ params }) {
	const show_number = parseInt(params.number);

	const transcript = await prisma_client.transcript.findUnique({
		where: { show_number },
		include: {
			show: {
				select: {
					title: true,
					number: true,
					date: true
				}
			},
			utterances: {
				select: {
					speaker: true,
					transcript_value: true,
					start: true,
					end: true
				},
				orderBy: {
					start: 'asc'
				}
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
