// import { type Utterance } from '@deepgram/sdk/dist/types';
import { Prisma } from '@prisma/client';

export type SlimUtterance = {
	speaker?: string;
	speakerId: number;
	transcript: string;
	condensedTranscript?: string;
	start: number;
	end: number;
	utteranceIndex: number;
	showNumber: number;
};

export type TranscribedShow = {
	name: string;
	number: number;
	utterances: SlimUtterance[];
};

type SpeakerMap = Map<number, 'Wes Bos' | 'Scott Tolinski' | 'Growler' | string>;

// Slim Utterance joins utterances together if a speaker is the same making it easier to read as well as detect speakers names. We can run this on already saved utterances, or on utterances that have just been fetched from Deepgram
type PrismaUtterance = Prisma.TranscriptUtteranceGetPayload<{
	include: {
		transcript: true;
	};
}>;
export function getSlimUtterances(
	utterances: (PrismaUtterance | Utterance)[],
	showNumber: number
): SlimUtterance[] {
	const start: SlimUtterance[] = [];
	const slim = utterances.reduce((acc, utterance, index) => {
		const { speaker, start, end } = utterance;
		const transcript_value =
			'transcript_value' in utterance ? utterance.transcript_value : utterance.transcript;
		const lastUtterance = acc[acc.length - 1];
		// If its the same speaker as the last one. Tack it onto that last one
		if (lastUtterance?.speakerId === speaker) {
			lastUtterance.transcript += transcript_value;
			lastUtterance.end = end;
			return acc;
		}
		// Otherwise create a new item in the utterance array
		const slimUtterance: Partial<SlimUtterance> = {
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
	return slim.map((utterance, utteranceIndex) => {
		const speakerName = speakerNames.get(utterance.speakerId);
		return {
			...utterance,
			utteranceIndex,
			speaker: speakerName
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

export function formatAsTranscript(utterances: SlimUtterance[]) {
	return utterances.reduce((acc, utterance) => {
		// TODO: We might need to reinstate condensedTranscript here
		const timestamp = formatTime(utterance.start);
		return `${acc}\n${timestamp} ${utterance.speaker}:\n${
			/*condensedTranscript || */ utterance.transcript
		}\n`;
	}, '');
}

/**
 * @description Format the utterances for embedding - The goal here is to make it as small as possible so we can fit within the 8k token limit
 */
export function formatForEmbedding(utterances: SlimUtterance[]) {
	return utterances.reduce((acc, utterance) => {
		const { speaker, transcript, condensedTranscript } = utterance;
		return `${acc}\n${condensedTranscript || transcript}`;
	}, '');
}

export function formatAsSTR(utterances: SlimUtterance[]) {
	// TODO
}

export function detectSpeakerNames(utterances: SlimUtterance[]): SpeakerMap {
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
	console.log(`We have ${speakerNumbers.size} speakers`);
	const speakers = new Map();
	for (const utterance of utterances) {
		// If this speaker has already been identified, skip it
		if (speakers.get(utterance.speakerId)) continue;
		// Otherwise look for a match
		for (const [saying, speaker] of sayings) {
			// console.log('Checking', saying, speaker,);
			const regex = typeof saying === 'string' ? new RegExp(saying, 'i') : saying;
			if (regex.test(utterance.transcript)) {
				console.log(`Found ${speaker}!`, saying);
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
