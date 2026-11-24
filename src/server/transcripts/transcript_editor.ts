import { error } from '@sveltejs/kit';
import { and, asc, count, eq, ilike, sql } from 'drizzle-orm';

import { assert_admin_actor, type Actor } from '$server/auth/authorization';
import { db } from '$server/db/client';
import { show, transcriptUtterance } from '$server/db/schema';

// Editing an episode's transcript in the admin: name its voices and fix its lines. The words under
// each line are Grok's timing data; the site shows the line text, so a fixed line shows as fixed.

const LINES_PER_PAGE = 50;

export interface TranscriptLinesInput {
	show_number: number;
	search_text?: string;
	page?: number;
}

/** The episode's voices with how many lines each has, and one page of lines (optionally searched). */
export async function get_transcript_editor(actor: Actor, input: TranscriptLinesInput) {
	assert_admin_actor(actor);

	const episode = await db.query.show.findFirst({
		where: eq(show.number, input.show_number),
		columns: {},
		with: { transcript: { columns: { id: true } } }
	});
	const episode_transcript = episode?.transcript;
	if (!episode_transcript) return null;

	const speakers = await db
		.select({
			speaker: transcriptUtterance.speaker,
			// A voice has one name; the first line's stands for all of them
			speaker_name: sql<string | null>`min(${transcriptUtterance.speaker_name})`,
			lines: count()
		})
		.from(transcriptUtterance)
		.where(eq(transcriptUtterance.transcript_id, episode_transcript.id))
		.groupBy(transcriptUtterance.speaker)
		.orderBy(asc(transcriptUtterance.speaker));

	const search_text = input.search_text?.trim() ?? '';
	const where_lines = search_text
		? and(
				eq(transcriptUtterance.transcript_id, episode_transcript.id),
				ilike(transcriptUtterance.transcript_value, `%${search_text}%`)
			)
		: eq(transcriptUtterance.transcript_id, episode_transcript.id);

	const [total_row] = await db
		.select({ value: count() })
		.from(transcriptUtterance)
		.where(where_lines);
	const total = Number(total_row?.value ?? 0);
	const total_pages = Math.max(1, Math.ceil(total / LINES_PER_PAGE));
	const page = Math.min(Math.max(1, input.page ?? 1), total_pages);

	const lines = await db
		.select({
			id: transcriptUtterance.id,
			start: transcriptUtterance.start,
			speaker: transcriptUtterance.speaker,
			speaker_name: transcriptUtterance.speaker_name,
			text: transcriptUtterance.transcript_value
		})
		.from(transcriptUtterance)
		.where(where_lines)
		.orderBy(asc(transcriptUtterance.start))
		.limit(LINES_PER_PAGE)
		.offset((page - 1) * LINES_PER_PAGE);

	return {
		transcript_id: episode_transcript.id,
		speakers: speakers.map((row) => ({ ...row, lines: Number(row.lines) })),
		lines,
		total,
		page,
		total_pages
	};
}

/** Names one voice on every line it speaks. An empty name clears it. */
export async function rename_transcript_speaker(
	actor: Actor,
	input: { transcript_id: string; speaker: number; speaker_name: string }
) {
	assert_admin_actor(actor);

	const speaker_name = input.speaker_name.trim() || null;
	const renamed = await db
		.update(transcriptUtterance)
		.set({ speaker_name })
		.where(
			and(
				eq(transcriptUtterance.transcript_id, input.transcript_id),
				eq(transcriptUtterance.speaker, input.speaker)
			)
		)
		.returning({ id: transcriptUtterance.id });
	if (renamed.length === 0) error(404, 'No lines for that voice');

	return { lines: renamed.length };
}

/** Fixes one line's text. */
export async function update_transcript_line(actor: Actor, input: { id: string; text: string }) {
	assert_admin_actor(actor);

	const text = input.text.trim();
	if (!text) error(400, 'A line needs some text');

	const updated = await db
		.update(transcriptUtterance)
		.set({ transcript_value: text })
		.where(eq(transcriptUtterance.id, input.id))
		.returning({ id: transcriptUtterance.id });
	if (updated.length === 0) error(404, 'Line not found');

	return { success: true };
}
