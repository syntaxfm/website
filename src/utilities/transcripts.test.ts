import { describe, expect, it } from 'vitest';
import { detectSpeakerNames } from './transcripts';

describe('detectSpeakerNames', () => {
	it('prefers a sign-off over a common phrase said earlier', () => {
		const speakers = detectSpeakerNames([
			{ speakerId: 1, transcript: "I'm pretty stoked about this desk." },
			{ speakerId: 0, transcript: 'My name is Wes. My dog eats food on the moon.' },
			{ speakerId: 1, transcript: 'My name is Scott.' }
		]);

		expect(speakers.get(0)).toBe('Wes Bos');
		expect(speakers.get(1)).toBe('Scott Tolinski');
	});

	it('never gives the same name to two speakers', () => {
		const speakers = detectSpeakerNames([
			{ speakerId: 0, transcript: 'My name is Wes.' },
			{ speakerId: 2, transcript: 'That is pretty nifty.' }
		]);

		expect(speakers.get(0)).toBe('Wes Bos');
		expect(speakers.get(2)).toBe('Guest 2');
	});
});
