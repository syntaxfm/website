import type { Prisma } from '@prisma/client';

export type SlimUtterance = {
	speaker?: number;
	speakerId: number;
	speakerName?: string;
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

export type SpeakerMap = Map<number, 'Wes Bos' | 'Scott Tolinski' | 'Growler' | string>;

// Slim Utterance joins utterances together if a speaker is the same making it easier to read as well as detect speakers names. We can run this on already saved utterances, or on utterances that have just been fetched from Deepgram
export type PrismaUtterance = Prisma.TranscriptUtteranceGetPayload<{
	select: {
		speaker: true;
		transcript_value: true;
		start: true;
		end: true;
	};
}> & {
	speaker: number | null;
};
