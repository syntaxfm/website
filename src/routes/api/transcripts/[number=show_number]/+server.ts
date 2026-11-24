import { in_order_added } from '#lib/utils/in_order_added.ts';
import { error, json } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';
import { db } from '$server/db/client';
import { getSlimUtterances, people_on_show } from '#lib/transcript/utils.ts';
import { is_released } from '$server/content/released';

export async function GET({ params }) {
	const show_number = parseInt(params.number);

	const episode = await db.query.show.findFirst({
		where: (shows, { eq }) => eq(shows.number, show_number),
		columns: {
			title: true,
			number: true,
			date: true
		},
		with: {
			meta: { columns: { status: true, published_at: true } },
			hosts: {
				orderBy: in_order_added,
				with: { profile: { columns: { name: true } } }
			},
			guests: {
				orderBy: in_order_added,
				with: { guest: { columns: { name: true } } }
			},
			transcript: {
				columns: { id: true },
				with: {
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
			}
		}
	});

	if (!episode?.transcript || !is_released(episode.meta)) {
		error(404, 'Transcript not found');
	}
	const transcript = { ...episode.transcript, show: episode };

	const grouped_utterances = getSlimUtterances(
		transcript.utterances,
		show_number,
		true,
		people_on_show(
			transcript.show.hosts.flatMap(({ profile }) => profile.name ?? []),
			transcript.show.guests.map(({ guest }) => guest.name)
		)
	);

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
