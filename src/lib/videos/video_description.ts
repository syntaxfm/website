import format_time, { tsToS } from '$utilities/format_time';
import type { TopicSummary } from '#lib/transcript/utils.ts';

// A YouTube description as a video page shows it: the prose, and the chapters as their own list.
// Link, hashtag and promo lines are left out; on old Level Up uploads they're most of the text and
// point at dead pages (leveluptutorials.com, bit.ly).

export type VideoChapter = { seconds: number; label: string };
export type VideoDescription = { paragraphs: string[]; chapters: VideoChapter[] };

// YouTube only treats timestamps as chapters when there are at least three
const MIN_CHAPTERS = 3;
const CHAPTER_LINE = /^\s*\(?((?:\d{1,2}:)?\d{1,2}:\d{2})\)?\s*[-–—:|]?\s*(.+)$/;
const DROPPED_LINE =
	/https?:\/\/|www\.|^\s*#\w|patreon|subscribe|sponsor|merch|discord|level ?up tut|leveluptutorials|twitter|instagram|tiktok|linkedin|bluesky|^\s*[-–—_=*]{3,}\s*$/i;

export function read_video_description(text: string): VideoDescription {
	const lines = text.replace(/\r/g, '').split('\n');
	const chapter_lines = lines.flatMap((line) => {
		const match = line.match(CHAPTER_LINE);
		return match ? [{ seconds: tsToS(match[1]), label: match[2].trim() }] : [];
	});
	const chapters = chapter_lines.length >= MIN_CHAPTERS ? chapter_lines : [];

	const paragraphs: string[] = [];
	let current: string[] = [];
	for (const line of lines) {
		const is_chapter = chapters.length > 0 && CHAPTER_LINE.test(line);
		if (!line.trim() || is_chapter || DROPPED_LINE.test(line)) {
			if (current.length) paragraphs.push(current.join(' '));
			current = [];
			continue;
		}
		current.push(line.trim());
	}
	if (current.length) paragraphs.push(current.join(' '));

	return { paragraphs, chapters };
}

/** Chapters as transcript topics (Transcript.svelte), the way an episode's AI topics are given. */
export function chapters_as_topics(chapters: VideoChapter[]): TopicSummary[] {
	return chapters.map((chapter) => ({ time: format_time(chapter.seconds), text: chapter.label }));
}

/** Seconds as an ISO 8601 duration (PT1H2M3S), the form schema.org wants. */
export function to_iso_duration(total_seconds: number): string {
	const hours = Math.floor(total_seconds / 3600);
	const minutes = Math.floor((total_seconds % 3600) / 60);
	const seconds = Math.floor(total_seconds % 60);
	return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${seconds || (!hours && !minutes) ? `${seconds}S` : ''}`;
}
