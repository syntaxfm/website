import type { Utterance } from '@deepgram/sdk/dist/types/utterance';
import type { PrismaUtterance, SlimUtterance, SpeakerMap } from './types';

/**
 * Get the slim version of the utterances. This is used for the transcript and embedding functions. It groups together utterances that have the same speaker.
 * @param utterances the utterances to slim. This can be used on both Prisma Database Utterances and straight from Deepgram.
 */

export function getSlimUtterances(
	utterances: PrismaUtterance[] | Pick<Utterance, 'transcript' | 'speaker' | 'start' | 'end'>[],
	showNumber: number,
	groupForPunctuation = true
): SlimUtterance[] {
	const start: Omit<SlimUtterance, 'utteranceIndex' | 'speakerName'>[] = [];
	const slim = utterances.reduce((acc, utterance) => {
		const { speaker, start, end } = utterance;
		// Prisma uses transcript_value, deepgram uses transcript
		const transcript_value =
			'transcript_value' in utterance ? utterance.transcript_value : utterance.transcript;
		const lastUtterance = acc[acc.length - 1];

		// If its the same speaker as the last one. Tack it onto that last one
		const last_speaker_is_current_speaker = lastUtterance?.speakerId === speaker;
		// If the last utterance ended in `.` or `?` or `!`
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
	const speakerNames = detectSpeakerNames(slim);
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

// Format time function, converts seconds into MM:SS or HH:MM:SS
export function formatTime(secs: number) {
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
	utterances: Pick<SlimUtterance, 'transcript' | 'speakerId'>[]
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
	// Todo Handle guests somehow
	// For now set anyone else as a guest
	for (const speaker of speakerNumbers) {
		if (!speakers.get(speaker)) {
			speakers.set(speaker, `Guest ${speaker}`);
		}
	}

	return speakers;
}
