import { describe, expect, it } from 'vitest';
import { detectSpeakerNames } from './utils';

const HOSTS = [
	{
		speakerId: 0,
		transcript: 'Welcome to Syntax the podcast with the tastiest web development treats.'
	},
	{ speakerId: 1, transcript: 'Drop a review if you like this show.' }
];

describe('detectSpeakerNames', () => {
	it('names the hosts from what they say', () => {
		const names = detectSpeakerNames(HOSTS);
		expect(names.get(0)).toBe('Wes Bos');
		expect(names.get(1)).toBe('Scott Tolinski');
	});

	it('names the one unrecognized voice after the show’s one guest', () => {
		const names = detectSpeakerNames(
			[...HOSTS, { speakerId: 2, transcript: 'Thanks for having me.' }],
			['Kyle Daigle']
		);
		expect(names.get(2)).toBe('Kyle Daigle');
	});

	it('skips hosts it already recognized when naming the last voice', () => {
		const names = detectSpeakerNames(
			[HOSTS[0], { speakerId: 1, transcript: 'I love Nuxt.' }],
			['Wes Bos', 'CJ']
		);
		expect(names.get(0)).toBe('Wes Bos');
		expect(names.get(1)).toBe('CJ');
	});

	it('keeps "Guest <n>" when it can’t tell which voice is the guest', () => {
		const two_voices = detectSpeakerNames(
			[...HOSTS, { speakerId: 2, transcript: 'Hi.' }, { speakerId: 3, transcript: 'Hello.' }],
			['Kyle Daigle']
		);
		expect(two_voices.get(2)).toBe('Guest 2');
		expect(two_voices.get(3)).toBe('Guest 3');

		const two_guests = detectSpeakerNames(
			[...HOSTS, { speakerId: 2, transcript: 'Hi.' }],
			['Kyle Daigle', 'Rich Harris']
		);
		expect(two_guests.get(2)).toBe('Guest 2');

		expect(detectSpeakerNames([...HOSTS, { speakerId: 2, transcript: 'Hi.' }]).get(2)).toBe(
			'Guest 2'
		);
	});
});
