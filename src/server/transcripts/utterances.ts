import type { NewUtterance, TranscribedWord } from './types';

// A pause this long starts a new passage even when the same person keeps talking (Deepgram, which
// made the older transcripts, split at 0.8 s too)
const PASSAGE_PAUSE_SECONDS = 0.8;

// Grok doesn't score its words. Scott chose to store 1 rather than make the columns nullable
// (2026-11-16); nothing on the site reads them.
const UNSCORED = 1;

// "Syntax." -> "syntax", the bare word Deepgram stored beside the punctuated one
function bare_word(text: string): string {
	return text.toLowerCase().replace(/[^\p{L}\p{N}'’-]/gu, '') || text;
}

/** Groups a transcription's words into passages: a new one at each change of voice or long pause. */
export function words_to_utterances(words: readonly TranscribedWord[]): NewUtterance[] {
	const utterances: NewUtterance[] = [];
	for (const word of words) {
		const current = utterances.at(-1);
		const previous_word = current?.words.at(-1);
		const continues =
			current &&
			previous_word &&
			current.speaker === word.speaker &&
			word.start - previous_word.end < PASSAGE_PAUSE_SECONDS;
		const stored_word = {
			word: bare_word(word.text),
			punctuated_word: word.text,
			start: word.start,
			end: word.end,
			speaker: word.speaker,
			confidence: UNSCORED,
			speaker_confidence: UNSCORED
		};
		if (continues) {
			current.transcript_value += ` ${word.text}`;
			current.end = word.end;
			current.words.push(stored_word);
		} else {
			utterances.push({
				start: word.start,
				end: word.end,
				transcript_value: word.text,
				speaker: word.speaker,
				channel: 0,
				confidence: UNSCORED,
				words: [stored_word]
			});
		}
	}
	return utterances;
}
