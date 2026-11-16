import { describe, expect, it } from 'vitest';
import {
	detectSpeakerNames,
	group_by_topic,
	nearest_passage_id,
	passage_ids,
	remove_flagging_utterances
} from './utils';
import { tsToS } from '$utilities/format_time';

describe('remove_flagging_utterances', () => {
	it('drops the lines said only for speaker detection', () => {
		const kept = remove_flagging_utterances([
			{ transcript: 'Purple cheese before meeting.' },
			{ transcript: 'My name is Scott Tolinski.' },
			{ transcript: 'My dog eats food on the moon.' },
			{ transcript: 'Today we talk about CSS.' }
		]);
		expect(kept).toEqual([{ transcript: 'Today we talk about CSS.' }]);
	});
});

describe('passage_ids', () => {
	it('names each passage by its start second, numbering repeats', () => {
		expect(passage_ids([0.4, 12.9, 12.2, 3600])).toEqual(['t-0', 't-12', 't-12-2', 't-3600']);
	});
});

describe('nearest_passage_id', () => {
	const passages = [
		{ id: 't-0', start: 0.2 },
		{ id: 't-14', start: 14.6 },
		{ id: 't-31', start: 31 }
	];

	it('leaves exact matches and other hashes to the browser', () => {
		expect(nearest_passage_id('#t-14', passages)).toBeNull();
		expect(nearest_passage_id('#overview-of-nuxt', passages)).toBeNull();
		expect(nearest_passage_id('', passages)).toBeNull();
	});

	it('points an outdated link at the passage that was playing at that second', () => {
		expect(nearest_passage_id('#t-15', passages)).toBe('t-14');
		expect(nearest_passage_id('#t-30-2', passages)).toBe('t-14');
		expect(nearest_passage_id('#t-9000', passages)).toBe('t-31');
	});

	it('falls back to the first passage for a time before it', () => {
		expect(nearest_passage_id('#t-0', [{ id: 't-3', start: 3 }])).toBe('t-3');
	});
});

describe('group_by_topic', () => {
	const topics = [
		{ time: '00:00', text: 'Intro', id: 1 },
		{ time: '01:00', text: 'CSS', id: 2 }
	];

	it('splits passages at each topic start', () => {
		const groups = group_by_topic(
			[{ start: 5 }, { start: 59 }, { start: 60 }, { start: 90 }],
			topics,
			tsToS
		);
		expect(groups.map((group) => [group.topic?.text, group.utterances.length])).toEqual([
			['Intro', 2],
			['CSS', 2]
		]);
	});

	it('keeps a topic that starts inside a long passage, so its anchor exists', () => {
		const groups = group_by_topic(
			[{ start: 0 }, { start: 90 }],
			[{ time: '00:30', text: 'Intro', id: 1 }, ...topics.slice(1)],
			tsToS
		);
		expect(groups.map((group) => [group.topic?.text ?? null, group.utterances.length])).toEqual([
			[null, 1],
			['Intro', 0],
			['CSS', 1]
		]);
	});

	it('keeps everything in one untitled group without topics', () => {
		expect(group_by_topic([{ start: 5 }, { start: 90 }], [], tsToS)).toEqual([
			{ topic: null, utterances: [{ start: 5 }, { start: 90 }] }
		]);
	});
});

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
