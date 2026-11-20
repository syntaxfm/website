// A video's transcript is YouTube's own captions: an uploaded track when there is one, otherwise
// YouTube's automatic (ASR) one. Listing a video's tracks costs 50 quota units, downloading one
// costs 200, and uploading a cleaned track costs 400; only the channel owner can download/upload
// (youtube_owner.ts).
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { OPENROUTER_API_KEY } from '$app/env/private';
import { db } from '$server/db/client';
import {
	content,
	transcript as transcripts,
	transcriptUtterance as transcript_utterances,
	video
} from '$server/db/schema';
import { as_array, as_string, read_path } from '#lib/utils/narrow.ts';
import {
	clean_caption_cues,
	type CaptionCleanContext,
	type CaptionCleanReport
} from './caption_cleaner';
import { get_youtube_owner_token } from './youtube_owner';

const API_BASE = 'https://www.googleapis.com/youtube/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/youtube/v3';
const LANGUAGE = 'en';
// Only auto-clean & re-upload recent uploads during the hourly cron so the 800-video historical
// backfill doesn't burn the 10,000-unit daily YouTube quota on old videos.
const AUTO_CLEAN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
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

export type CaptionTrackInfo = { id: string; kind: 'standard' | 'asr' };

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
		const body: unknown = await response.json().catch(() => null);
		const reason =
			as_string(read_path(body, ['error', 'errors', 0, 'reason'])) ??
			as_string(read_path(body, ['error', 'status']));
		const message = as_string(read_path(body, ['error', 'message'])) ?? response.statusText;
		throw new Error(
			`YouTube ${path.split('/')[0]} ${response.status}${reason ? ` ${reason}` : ''}: ${message}`
		);
	}
	return response;
}

// The English track to use: an uploaded one first, YouTube's automatic one otherwise
export function pick_caption_track_info(list: unknown): CaptionTrackInfo | null {
	const tracks = as_array(read_path(list, ['items'])).filter((item) =>
		as_string(read_path(item, ['snippet', 'language']))?.startsWith(LANGUAGE)
	);
	const kind = (item: unknown) => as_string(read_path(item, ['snippet', 'trackKind']));
	const standard = tracks.find((item) => kind(item)?.toLowerCase() === 'standard');
	if (standard) {
		const id = as_string(read_path(standard, ['id']));
		return id ? { id, kind: 'standard' } : null;
	}
	const asr = tracks.find((item) => kind(item)?.toLowerCase() === 'asr');
	if (asr) {
		const id = as_string(read_path(asr, ['id']));
		return id ? { id, kind: 'asr' } : null;
	}
	return null;
}

export function pick_caption_track(list: unknown): string | null {
	return pick_caption_track_info(list)?.id ?? null;
}

// The video's English captions track + SRT, or null when it has no English track
async function fetch_caption_track_srt(
	video_id: string,
	token: string
): Promise<{ track: CaptionTrackInfo; srt: string } | null> {
	const list = await youtube_get('captions', { part: 'snippet', videoId: video_id }, token);
	const track = pick_caption_track_info(await list.json());
	if (!track) return null;
	const download = await youtube_get(`captions/${track.id}`, { tfmt: 'srt' }, token);
	return { track, srt: await download.text() };
}

// The video's captions as SRT, or null when it has no English track
async function fetch_caption_srt(video_id: string, token: string): Promise<string | null> {
	const result = await fetch_caption_track_srt(video_id, token);
	return result?.srt ?? null;
}

/** Builds the multipart/related payload for YouTube's captions upload API. */
export function build_caption_upload_multipart(
	boundary: string,
	metadata: Record<string, unknown>,
	srt: string
): string {
	return [
		`--${boundary}`,
		'Content-Type: application/json; charset=UTF-8',
		'',
		JSON.stringify(metadata),
		`--${boundary}`,
		'Content-Type: application/octet-stream',
		'',
		srt,
		`--${boundary}--`,
		''
	].join('\r\n');
}

/**
 * Uploads a cleaned English SRT track to YouTube via captions.insert (400 quota units) or updates
 * an existing standard track via captions.update (450 quota units).
 */
export async function upload_caption_srt(
	video_id: string,
	srt: string,
	token: string,
	existing_standard_track_id?: string
): Promise<string> {
	const boundary = `syntax-captions-${randomUUID()}`;
	const metadata = existing_standard_track_id
		? { id: existing_standard_track_id, snippet: { isDraft: false } }
		: {
				snippet: {
					videoId: video_id,
					language: LANGUAGE,
					name: '',
					isDraft: false
				}
			};
	const body = build_caption_upload_multipart(boundary, metadata, srt);
	const response = await fetch(`${UPLOAD_API_BASE}/captions?part=snippet&uploadType=multipart`, {
		method: existing_standard_track_id ? 'PUT' : 'POST',
		headers: {
			authorization: `Bearer ${token}`,
			'content-type': `multipart/related; boundary=${boundary}`
		},
		body
	});
	const response_text = await response.text();
	if (!response.ok) {
		let parsed: unknown;
		try {
			parsed = JSON.parse(response_text);
		} catch {
			parsed = null;
		}
		const reason =
			as_string(read_path(parsed, ['error', 'errors', 0, 'reason'])) ??
			as_string(read_path(parsed, ['error', 'status']));
		const message = as_string(read_path(parsed, ['error', 'message'])) ?? response.statusText;
		throw new Error(
			`YouTube captions upload ${response.status}${reason ? ` ${reason}` : ''}: ${message}`
		);
	}
	const parsed: unknown = JSON.parse(response_text);
	return as_string(read_path(parsed, ['id'])) ?? existing_standard_track_id ?? '';
}

export type CleanVideoCaptionsResult =
	| { status: 'no_captions' }
	| { status: 'already_standard'; track_id: string }
	| {
			status: 'cleaned';
			uploaded: boolean;
			track_id: string;
			cues: CaptionCue[];
			srt: string;
			passages: CaptionPassage[];
			report: CaptionCleanReport;
	  };

/**
 * Downloads a video's YouTube ASR SRT, cleans technical/dev terms, returns the word-correction
 * report, and optionally uploads the cleaned standard English track back to YouTube.
 */
export async function clean_video_captions(
	video_id: string,
	context: CaptionCleanContext,
	options: {
		upload?: boolean;
		force?: boolean;
		token?: string;
		model?: string;
		api_key?: string;
		skip_llm?: boolean;
	} = {}
): Promise<CleanVideoCaptionsResult> {
	const token = options.token ?? (await get_youtube_owner_token());
	const fetched = await fetch_caption_track_srt(video_id, token);
	if (!fetched) return { status: 'no_captions' };
	if (fetched.track.kind === 'standard' && !options.force) {
		return { status: 'already_standard', track_id: fetched.track.id };
	}

	const original_cues = parse_srt(fetched.srt);
	const cleaned = await clean_caption_cues(original_cues, context, {
		model: options.model,
		api_key: options.api_key,
		skip_llm: options.skip_llm
	});

	let uploaded = false;
	let track_id = fetched.track.id;
	if (options.upload && cleaned.report.cues_changed > 0) {
		track_id = await upload_caption_srt(
			video_id,
			cleaned.srt,
			token,
			fetched.track.kind === 'standard' ? fetched.track.id : undefined
		);
		uploaded = true;
	}

	return {
		status: 'cleaned',
		uploaded,
		track_id,
		cues: cleaned.cues,
		srt: cleaned.srt,
		passages: cues_to_passages(cleaned.cues),
		report: cleaned.report
	};
}

/**
 * Connect YouTube's check: downloads the newest video's captions with the new sign-in, since
 * that's the one thing it's for. YouTube only lets some channel roles do it.
 */
export async function check_caption_access(access_token: string): Promise<void> {
	const [newest] = await db
		.select({ youtube_id: video.id })
		.from(content)
		.innerJoin(video, eq(video.content_id, content.id))
		.where(and(eq(content.type, 'VIDEO'), eq(content.status, 'PUBLISHED')))
		.orderBy(desc(content.published_at))
		.limit(1);
	if (!newest) return;
	try {
		await fetch_caption_srt(newest.youtube_id, access_token);
	} catch (download_error) {
		console.error('Connect YouTube: caption check failed', download_error);
		const youtube_says = download_error instanceof Error ? download_error.message : 'no answer';
		throw new Error(`That account couldn’t download Syntax’s captions. ${youtube_says}`, {
			cause: download_error
		});
	}
}

// The newest published video still without a transcript
async function get_next_video() {
	const [next] = await db
		.select({
			youtube_id: video.id,
			content_id: content.id,
			title: content.title,
			description: video.description,
			published_at: content.published_at
		})
		.from(content)
		.innerJoin(video, eq(video.content_id, content.id))
		.leftJoin(transcripts, eq(transcripts.content_id, content.id))
		.where(and(eq(content.type, 'VIDEO'), eq(content.status, 'PUBLISHED'), isNull(transcripts.id)))
		.orderBy(desc(content.published_at), asc(content.id))
		.limit(1);
	return next ?? null;
}

/**
 * Saves YouTube's captions as the transcript of the newest video without one. Recent uploads
 * with only ASR captions are cleaned for dev/AI terms and uploaded back to YouTube as a standard
 * track when OPENROUTER_API_KEY is configured. A video with no English captions gets an empty
 * transcript, so the next run moves on instead of asking again.
 */
export async function import_next_video_captions(): Promise<string> {
	const next = await get_next_video();
	if (!next) return 'Every video has a transcript';

	const token = await get_youtube_owner_token();
	const fetched = await fetch_caption_track_srt(next.youtube_id, token);
	let cues = fetched ? parse_srt(fetched.srt) : [];
	let clean_note = '';

	const is_recent =
		next.published_at !== null && Date.now() - next.published_at.getTime() <= AUTO_CLEAN_MAX_AGE_MS;

	if (fetched && fetched.track.kind === 'asr' && is_recent && OPENROUTER_API_KEY) {
		try {
			const cleaned = await clean_caption_cues(cues, {
				title: next.title,
				description: next.description ?? ''
			});
			cues = cleaned.cues;
			let uploaded = false;
			if (cleaned.report.cues_changed > 0) {
				try {
					await upload_caption_srt(next.youtube_id, cleaned.srt, token);
					uploaded = true;
				} catch (upload_error) {
					console.error(
						`Video captions: cleaned SRT upload failed for ${next.youtube_id}`,
						upload_error
					);
				}
			}
			clean_note = ` (cleaned ${cleaned.report.misheard_fixes} misheard + ${cleaned.report.format_fixes} format fixes${uploaded ? ', uploaded to YouTube' : ''})`;
		} catch (clean_error) {
			console.error(`Video captions: ASR clean failed for ${next.youtube_id}`, clean_error);
		}
	}

	const passages = cues_to_passages(cues);
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
		? `Captions for "${next.title}": ${passages.length} passages${clean_note}`
		: `No English captions for "${next.title}"`;
}
