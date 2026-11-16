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

// A word as speech-to-text returns it: punctuated text, its time in seconds and which voice said it
export type TranscribedWord = {
	text: string;
	start: number;
	end: number;
	speaker: number;
};

// A passage and its words, ready to save (transcript_utterances + transcript_utterance_words)
export type NewUtterance = {
	start: number;
	end: number;
	transcript_value: string;
	speaker: number;
	channel: number;
	confidence: number;
	words: {
		word: string;
		punctuated_word: string;
		start: number;
		end: number;
		speaker: number;
		confidence: number;
		speaker_confidence: number;
	}[];
};

// Slim Utterance joins utterances together if a speaker is the same making it easier to read as well as detect speakers names. We can run this on already saved utterances, or on utterances that have just been fetched from Deepgram
export type DBUtterance = {
	speaker: number;
	transcript_value: string;
	start: number;
	end: number;
};
