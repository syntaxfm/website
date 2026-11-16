/* eslint-disable @typescript-eslint/naming-convention */
import type { SyncPrerecordedResponse } from '@deepgram/sdk';
import slug from 'speakingurl';
import type { DBUtterance, SlimUtterance, SpeakerMap } from '$server/transcripts/types';

type Utterance = NonNullable<SyncPrerecordedResponse['results']['utterances']>[0];

/**
 * Get the slim version of the utterances. This is used for the transcript and embedding functions. It groups together utterances that have the same speaker.
 * @param utterances the utterances to slim. This can be used on both Database Utterances and straight from Deepgram.
 * @param people_on_show the show's hosts and guests, so a lone unnamed one is named instead of "Guest <n>"
 */

export function getSlimUtterances(
	utterances:
		| Pick<DBUtterance, 'speaker' | 'start' | 'end' | 'transcript_value'>[]
		| Pick<Utterance, 'transcript' | 'speaker' | 'start' | 'end'>[],
	showNumber: number,
	groupForPunctuation = true,
	people_on_show: string[] = []
): SlimUtterance[] {
	const start: Omit<SlimUtterance, 'utteranceIndex' | 'speakerName'>[] = [];
	const slim = utterances.reduce((acc, utterance) => {
		const { speaker, start, end } = utterance;
		// DB uses transcript_value, deepgram uses transcript
		const transcript_value =
			'transcript_value' in utterance ? utterance.transcript_value : utterance.transcript;
		const lastUtterance = acc[acc.length - 1];

		// If its the same speaker as the last one. Tack it onto that last one
		const last_speaker_is_current_speaker = lastUtterance?.speakerId === speaker;
		// If the last utterance ended in `.` or `?` or `!``
		const last_utterance_ended_in_punctuation =
			groupForPunctuation &&
			(lastUtterance?.transcript.endsWith('.') ||
				lastUtterance?.transcript.endsWith('!') ||
				lastUtterance?.transcript.endsWith('!'));

		if (last_speaker_is_current_speaker && !last_utterance_ended_in_punctuation) {
			lastUtterance.transcript += ` ${transcript_value}`;
			lastUtterance.end = end;
			return acc;
		}
		// Otherwise create a new item in the utterance array. We add the speaker name and utterance index in the next step
		const slimUtterance = {
			speakerId: speaker as number, // we always have a speaker id
			transcript: transcript_value,
			start,
			end,
			showNumber
		};
		return [...acc, slimUtterance];
	}, start);
	const speakerNames = detectSpeakerNames(slim, people_on_show);
	// Add speaker names and index to existing utterances
	return slim.map((utterance, utteranceIndex: number) => {
		const speakerName = speakerNames.get(utterance.speakerId);
		return {
			...utterance,
			utteranceIndex,
			speakerName: speakerName
		};
	});
}

// Lines the hosts say only so the speaker detector can tell them apart ("purple cheese before
// meeting"); readers never see them
const FLAGGING_PATTERNS = [
	/purple cheese before meeting/i,
	/^my name is scott/i,
	/my dog eats food ?(?:on)? the moon/i
];

export function remove_flagging_utterances<T extends { transcript: string }>(utterances: T[]): T[] {
	return utterances.filter(
		(utterance) => !FLAGGING_PATTERNS.some((pattern) => pattern.test(utterance.transcript))
	);
}

// A passage's anchor is its start second, so a link like /transcript#t-1234 survives re-renders
// and means the same moment in the audio. Two passages starting in the same second get -2, -3.
export function passage_ids(starts: readonly number[]): string[] {
	const used = new Map<string, number>();
	return starts.map((start) => {
		const base = `t-${Math.floor(start)}`;
		const count = (used.get(base) ?? 0) + 1;
		used.set(base, count);
		return count === 1 ? base : `${base}-${count}`;
	});
}

const PASSAGE_HASH = /^#t-(\d+)(?:-\d+)?$/;

// For a passage link that no longer matches a passage exactly (the transcript was re-run and the
// passages start a second or two differently), the passage it most likely meant: the last one
// starting at or before that second. Null when the hash isn't a passage link or matches exactly.
export function nearest_passage_id(
	hash: string,
	passages: readonly { id: string; start: number }[]
): string | null {
	const match = PASSAGE_HASH.exec(hash);
	if (!match || passages.length === 0) return null;
	if (passages.some((passage) => `#${passage.id}` === hash)) return null;
	const seconds = Number(match[1]);
	const before = passages.filter((passage) => Math.floor(passage.start) <= seconds).at(-1);
	return (before ?? passages[0]).id;
}

export type TopicSummary = { time: string; text: string; id?: number };

// A transcript topic's anchor (/transcript#css-container-queries), for its contents list and for
// topic pages that link to the moment a topic comes up
export function topic_anchor(topic_text: string): string {
	return slug(topic_text);
}

// Splits the transcript at each AI summary topic's start time. Passages before the first topic,
// or a transcript with no topics, form one group with a null topic. Every topic gets a group, even
// one that starts inside a long passage and so has none of its own: its heading is still there for
// the contents list and topic pages to link to.
export function group_by_topic<T extends { start: number }>(
	utterances: readonly T[],
	topics: readonly TopicSummary[],
	to_seconds: (time: string) => number
): { topic: TopicSummary | null; utterances: T[] }[] {
	const in_time_order = [...topics].sort((a, b) => to_seconds(a.time) - to_seconds(b.time));
	const groups: { topic: TopicSummary | null; utterances: T[] }[] = in_time_order.map((topic) => ({
		topic,
		utterances: []
	}));
	const untitled: T[] = [];
	for (const utterance of utterances) {
		const index = in_time_order.findLastIndex(
			(summary) => utterance.start >= to_seconds(summary.time)
		);
		if (index === -1) untitled.push(utterance);
		else groups[index].utterances.push(utterance);
	}
	return untitled.length > 0 ? [{ topic: null, utterances: untitled }, ...groups] : groups;
}

// Format time function, converts seconds into MM:SS or HH:MM:SS
function formatTime(secs: number) {
	const seconds = Math.round(secs);
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds - hours * 3600) / 60);
	const remainingSeconds = seconds - hours * 3600 - minutes * 60;
	const minutesString = minutes < 10 ? `0${minutes}` : `${minutes}`;
	const secondsString = remainingSeconds < 10 ? `0${remainingSeconds}` : `${remainingSeconds}`;
	if (hours > 0) {
		const hoursString = hours < 10 ? `0${hours}` : `${hours}`;
		return `${hoursString}:${minutesString}:${secondsString}`;
	}
	return `${minutesString}:${secondsString}`;
}

function getSpeakerShortName(speaker: number | undefined) {
	const shortForms = new Map([
		['Scott Tolinski', 'Scott'],
		['Wes Bos', 'Wes']
	]);
	return shortForms.get(speaker) || speaker;
}

export function formatAsTranscript(utterances: SlimUtterance[]) {
	return utterances.reduce((acc, utterance) => {
		// TODO: We might need to reinstate condensedTranscript here
		const timestamp = formatTime(utterance.start);
		return `${acc}\n${timestamp} ${getSpeakerShortName(utterance.speaker as number)}:\n${
			utterance.condensedTranscript || utterance.transcript
		}\n`;
	}, '');
}

/**
 * @description Format the utterances for embedding - The goal here is to make it as small as possible so we can fit within the 8k token limit
 */
export function formatForEmbedding(utterances: SlimUtterance[]) {
	return utterances.reduce((acc, utterance) => {
		const { transcript, condensedTranscript } = utterance;
		return `${acc}\n${condensedTranscript || transcript}`;
	}, '');
}

export function detectSpeakerNames(
	utterances: Pick<SlimUtterance, 'transcript' | 'speakerId'>[],
	people_on_show: string[] = []
): SpeakerMap {
	// Logic:
	// Scott always says "drop a review if you like this show" at the end of each podcast
	// Wes wes Often says "the podcast with the tastiest" web development treats
	// Wes and Scott often say "My name is Scott | Wes". Account for "West" currently
	// Scott often says "I'm from Denver"
	// Wes often says "I'm (a developer) from Canada"
	// The announcer, "Growler", is always first, therefor Speaker 0
	// Any other speakers are guests and can be Labeled from the show notes
	const sayings: [string | RegExp, string][] = [
		// Scott
		['purple cheese before meeting', 'Scott Tolinski'],
		['drop a review if you like this show', 'Scott Tolinski'],
		['My name is Scott', 'Scott Tolinski'],
		[/^(I'm\s+)?(a\s+)?(developer\s+)?from\s+Denver$/, 'Scott Tolinski'],
		// Wes
		[/my dog eats food ?(?:on)? the moon/i, 'Wes Bos'],
		['welcome to syntax the podcast with the tastiest', 'Wes Bos'],
		['My name is Wes', 'Wes Bos'],
		['My name is West', 'Wes Bos'],
		['pretty stoked', 'Wes Bos'],
		['pretty nifty', 'Wes Bos'],
		['forward slash courses', 'Wes Bos'],
		['eats food', 'Wes Bos'],
		[/^(I'm\s+)?(a\s+)?(developer\s+)?from\s+Canada$/i, 'Wes Bos'],
		['Mr. Scott Tolinski', 'Wes Bos'],
		// Growler
		['Open wide dev', 'Announcer'],
		['to use human language', 'Announcer'],
		['Strap yourself in', 'Announcer']
	];
	// First get a list of all speakers
	const speakerNumbers = new Set(utterances.map((utt) => utt.speakerId));
	// console.log(`We have ${speakerNumbers.size} speakers`);
	const speakers = new Map();
	for (const utterance of utterances) {
		// If this speaker has already been identified, skip it
		if (speakers.get(utterance.speakerId)) continue;
		// Otherwise look for a match
		for (const [saying, speaker] of sayings) {
			// console.log('Checking', saying, speaker,);
			const regex = typeof saying === 'string' ? new RegExp(saying, 'i') : saying;
			if (regex.test(utterance.transcript)) {
				// console.log(`Found ${speaker}!`, saying);
				speakers.set(utterance.speakerId, speaker);
				break;
			}
		}
	}
	// With one person on the show left unnamed and one voice left unrecognized, that voice is them.
	// Anything less certain stays "Guest <n>" rather than risk naming the wrong person.
	const named = new Set(speakers.values());
	const unnamed_people = [...new Set(people_on_show)].filter((name) => !named.has(name));
	const unrecognized = [...speakerNumbers].filter((speaker) => !speakers.get(speaker));
	const lone_person =
		unnamed_people.length === 1 && unrecognized.length === 1 ? unnamed_people[0] : null;
	for (const speaker of unrecognized) {
		speakers.set(speaker, lone_person ?? `Guest ${speaker}`);
	}

	return speakers;
}
