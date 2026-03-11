import { error, json } from '@sveltejs/kit';
import { prisma_client } from '$/server/prisma-client';

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
					speakerName: true,
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

	return json(
		{
			show_title: transcript.show.title,
			show_number: transcript.show.number,
			utterances: transcript.utterances.map((utterance) => ({
				speaker: utterance.speaker,
				speaker_name: utterance.speakerName,
				transcript: utterance.transcript_value,
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
