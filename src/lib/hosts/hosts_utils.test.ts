import { describe, expect, it } from 'vitest';
import { get_faces_from_show, get_people_line } from './hosts_utils';

const wes = { profile: { name: 'Wes Bos', username: 'wesbos' } };
const cj = { profile: { name: 'CJ Reynolds', username: 'w3cj' } };
const scott = { profile: { name: 'Scott Tolinski', username: 'stolinski' } };

describe('get_people_line', () => {
	it('names the hosts by first name', () => {
		const faces = get_faces_from_show({ hosts: [wes, cj, scott], guests: [] });

		expect(get_people_line(faces)).toBe('Wes, CJ & Scott');
	});

	it('joins two hosts without a comma', () => {
		const faces = get_faces_from_show({ hosts: [wes, scott], guests: [] });

		expect(get_people_line(faces)).toBe('Wes & Scott');
	});

	it('names a guest in full after the hosts', () => {
		const faces = get_faces_from_show({
			hosts: [wes, scott],
			guests: [{ guest: { name: 'Ben Vinegar', github: 'benvinegar' } }]
		});

		expect(get_people_line(faces)).toBe('Wes & Scott with Ben Vinegar');
	});

	it('falls back to Wes and Scott for an episode with no hosts recorded', () => {
		const faces = get_faces_from_show({ hosts: [], guests: [] });

		expect(get_people_line(faces)).toBe('Wes & Scott');
	});
});
