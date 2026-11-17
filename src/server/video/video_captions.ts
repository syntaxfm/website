// A video's transcript is YouTube's own captions: an uploaded track when there is one, otherwise
// YouTube's automatic (ASR) one. Listing a video's tracks costs 50 quota units and downloading one
// costs 200, and only the channel owner can download (youtube_owner.ts).
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '$server/db/client';
import {
	content,
	transcript as transcripts,
	transcriptUtterance as transcript_utterances,
	video
} from '$server/db/schema';
import { as_array, as_string, read_path } from '#lib/utils/narrow.ts';
import { get_youtube_owner_token } from './youtube_owner';

const API_BASE = 'https://www.googleapis.com/youtube/v3';
const LANGUAGE = 'en';
// Caption lines are a few words each; a passage ends at a sentence once it's this long, or at a
// pause, so the transcript reads in paragraphs
const PASSAGE_MIN_SECONDS = 20;
const PASSAGE_MAX_SECONDS = 60;
const PASSAGE_PAUSE_SECONDS = 2;
// Captions carry no speakers or scores; stored like Grok's unscored words (utterances.ts)
const UNSCORED = 1;
const ROWS_PER_INSERT = 2000;

export type CaptionCue = { start: number; end: number; text: string };

export type CaptionPassage = { start: number; end: number; text: string };

function srt_seconds(time: string): number {
	const match = time.trim().match(/^(\d+):(\d{2}):(\d{2})[,.](\d{3})$/);
	if (!match) throw new Error(`Not an SRT time: ${time}`);
	const [, hours, minutes, seconds, milliseconds] = match;
	return (
		Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds) + Number(milliseconds) / 1000
	);
}

export function parse_srt(srt: string): CaptionCue[] {
	return srt
		.replace(/\r/g, '')
		.split(/\n{2,}/)
		.flatMap((block) => {
			const lines = block.trim().split('\n');
			const timing_index = lines.findIndex((line) => line.includes('-->'));
			if (timing_index === -1) return [];
			const [start, end] = lines[timing_index].split('-->');
			const text = lines
				.slice(timing_index + 1)
				.join(' ')
				.replace(/\s+/g, ' ')
				.trim();
			return text ? [{ start: srt_seconds(start), end: srt_seconds(end), text }] : [];
		});
}

export function cues_to_passages(cues: readonly CaptionCue[]): CaptionPassage[] {
	const passages: CaptionPassage[] = [];
	for (const cue of cues) {
		const current = passages.at(-1);
		const length = current ? current.end - current.start : 0;
		const ends_sentence = current ? /[.?!]["”’)]?$/.test(current.text) : false;
		const starts_new =
			!current ||
			cue.start - current.end >= PASSAGE_PAUSE_SECONDS ||
			length >= PASSAGE_MAX_SECONDS ||
			(length >= PASSAGE_MIN_SECONDS && ends_sentence);
		if (starts_new) {
			passages.push({ ...cue });
		} else {
			current.text += ` ${cue.text}`;
			current.end = cue.end;
		}
	}
	return passages;
}

async function youtube_get(path: string, params: Record<string, string>, token: string) {
	const url = new URL(`${API_BASE}/${path}`);
	url.search = new URLSearchParams(params).toString();
	const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
	if (!response.ok) {
		throw new Error(`YouTube ${path} failed: ${response.status} ${await response.text()}`);
	}
	return response;
}

// The English track to use: an uploaded one first, YouTube's automatic one otherwise
export function pick_caption_track(list: unknown): string | null {
	const tracks = as_array(read_path(list, ['items'])).filter((item) =>
		as_string(read_path(item, ['snippet', 'language']))?.startsWith(LANGUAGE)
	);
	const kind = (item: unknown) => as_string(read_path(item, ['snippet', 'trackKind']));
	const track =
		tracks.find((item) => kind(item)?.toLowerCase() === 'standard') ??
		tracks.find((item) => kind(item)?.toLowerCase() === 'asr');
	return track ? as_string(read_path(track, ['id'])) : null;
}

async function fetch_caption_passages(video_id: string): Promise<CaptionPassage[]> {
	const token = await get_youtube_owner_token();
	const list = await youtube_get('captions', { part: 'snippet', videoId: video_id }, token);
	const track_id = pick_caption_track(await list.json());
	if (!track_id) return [];
	const download = await youtube_get(`captions/${track_id}`, { tfmt: 'srt' }, token);
	return cues_to_passages(parse_srt(await download.text()));
}

// The newest published video still without a transcript
async function get_next_video() {
	const [next] = await db
		.select({ youtube_id: video.id, content_id: content.id, title: content.title })
		.from(content)
		.innerJoin(video, eq(video.content_id, content.id))
		.leftJoin(transcripts, eq(transcripts.content_id, content.id))
		.where(and(eq(content.type, 'VIDEO'), eq(content.status, 'PUBLISHED'), isNull(transcripts.id)))
		.orderBy(desc(content.published_at), asc(content.id))
		.limit(1);
	return next ?? null;
}

/**
 * Saves YouTube's captions as the transcript of the newest video without one. A video with no
 * English captions gets an empty transcript, so the next run moves on instead of asking again.
 */
export async function import_next_video_captions(): Promise<string> {
	const next = await get_next_video();
	if (!next) return 'Every video has a transcript';

	const passages = await fetch_caption_passages(next.youtube_id);
	const transcript_id = randomUUID();
	const rows = passages.map((passage) => ({
		transcript_id,
		start: passage.start,
		end: passage.end,
		transcript_value: passage.text,
		speaker: 0,
		speaker_name: null,
		channel: 0,
		confidence: UNSCORED
	}));

	await db.transaction(async (tx) => {
		await tx.insert(transcripts).values({ id: transcript_id, content_id: next.content_id });
		for (let start = 0; start < rows.length; start += ROWS_PER_INSERT) {
			await tx.insert(transcript_utterances).values(rows.slice(start, start + ROWS_PER_INSERT));
		}
	});
	return passages.length > 0
		? `Captions for "${next.title}": ${passages.length} passages`
		: `No English captions for "${next.title}"`;
}
