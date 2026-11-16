import { describe, expect, it } from 'vitest';
import { words_to_utterances } from './utterances';

const word = (text: string, start: number, speaker = 0) => ({
	text,
	start,
	end: start + 0.3,
	speaker
});

describe('words_to_utterances', () => {
	it('starts a passage when the voice changes', () => {
		const utterances = words_to_utterances([
			word('Welcome', 0),
			word('to', 0.35),
			word('Syntax.', 0.7),
			word('Hey!', 1.1, 1)
		]);

		expect(utterances.map((u) => [u.speaker, u.transcript_value])).toEqual([
			[0, 'Welcome to Syntax.'],
			[1, 'Hey!']
		]);
		expect(utterances[0]).toMatchObject({ start: 0, end: 1 });
	});

	it('starts a passage after a long pause from the same voice', () => {
		const utterances = words_to_utterances([word('So.', 0), word('Anyway,', 2)]);

		expect(utterances.map((u) => u.transcript_value)).toEqual(['So.', 'Anyway,']);
	});

	it('keeps each word with its bare form beside the punctuated one', () => {
		const [utterance] = words_to_utterances([word('Syntax.', 0), word("we're", 0.4)]);

		expect(utterance.words.map((w) => [w.word, w.punctuated_word])).toEqual([
			['syntax', 'Syntax.'],
			["we're", "we're"]
		]);
	});
});
