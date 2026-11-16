import { error, redirect } from '@sveltejs/kit';
import { db } from '$server/db/client';
import { edge_cached } from '$server/edge_cache';
import { get_show_detail_query } from '$server/shows/shows_queries';
import { transcript_markdown } from '#lib/transcript/transcript_markdown.ts';
import { getSlimUtterances, remove_flagging_utterances } from '#lib/transcript/utils.ts';
import type { RequestHandler } from './$types';

// The transcript as Markdown, for AI agents: /show/{number}/{slug}/transcript.md. Same passages
// and speaker names as the HTML page, each line linking to its passage there.

async function load_transcript_source(show_number: number) {
	const [show_row, transcript_row] = await Promise.all([
		db.query.show.findFirst(get_show_detail_query(show_number)),
		db.query.transcript.findFirst({
			where: (transcripts, { eq }) => eq(transcripts.show_number, show_number),
			columns: { show_number: true },
			with: {
				utterances: {
					columns: { speaker: true, start: true, end: true, transcript_value: true },
					orderBy: (utterances, { asc }) => [asc(utterances.start)]
				}
			}
		})
	]);
	if (!show_row || !transcript_row) return null;
	return {
		title: show_row.title,
		slug: show_row.slug,
		date: show_row.date,
		description: show_row.aiShowNote?.description ?? null,
		topics: (show_row.aiShowNote?.summary ?? []).map(({ time, text }) => ({ time, text })),
		people_on_show: [
			...show_row.hosts.flatMap(({ profile }) => profile.name ?? []),
			...show_row.guests.map(({ guest }) => guest.name)
		],
		utterances: transcript_row.utterances
	};
}

export const GET: RequestHandler = async function GET({ params, url, setHeaders }) {
	const show_number = Number(params.show_number);
	if (!Number.isInteger(show_number)) error(404, 'This show does not exist.');

	// A transcript doesn't change once it's made
	const source = await edge_cached(
		`transcript-md-${show_number}`,
		{ fresh_seconds: 60 * 60, stale_seconds: 60 * 60 * 24 * 30 },
		() => load_transcript_source(show_number)
	);
	const published = source ? new Date(source.date) : null;
	if (!source || !published || published > new Date()) {
		error(404, 'No transcript for this show.');
	}
	if (params.slug !== source.slug) {
		redirect(308, `/show/${show_number}/${source.slug}/transcript.md`);
	}

	const episode_url = `${url.origin}/show/${show_number}/${source.slug}`;
	const passages = remove_flagging_utterances(
		getSlimUtterances(source.utterances, show_number, true, source.people_on_show)
	).map((utterance) => ({
		start: utterance.start,
		speaker: utterance.speakerName || `Guest ${utterance.speakerId}`,
		text: utterance.transcript
	}));

	setHeaders({
		'cache-control': 'max-age=0, s-maxage=3600',
		'content-type': 'text/markdown; charset=utf-8'
	});
	return new Response(
		transcript_markdown({
			show_number,
			title: source.title,
			transcript_url: `${episode_url}/transcript`,
			episode_url,
			published,
			description: source.description,
			topics: source.topics,
			passages
		})
	);
};
