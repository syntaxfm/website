import { describe, expect, it } from 'vitest';
import {
	guest_description,
	pick_key_moments,
	topic_description,
	whole_word_pattern,
	type KeyMomentRow
} from './hubs';

function moment(show_number: number, text: string): KeyMomentRow {
	return { show_number, show_slug: `show-${show_number}`, show_title: 'T', time: '01:00', text };
}

describe('whole_word_pattern', () => {
	it('escapes regex characters and matches only the whole word', () => {
		const pattern = whole_word_pattern('C++');
		expect(pattern).toBe('(^|[^[:alnum:]_])C\\+\\+([^[:alnum:]_]|$)');
	});
});

describe('pick_key_moments', () => {
	it('takes one moment per episode, in the order given, up to the limit', () => {
		const rows = [moment(3, 'a'), moment(3, 'b'), moment(2, 'c'), moment(1, 'd')];
		expect(pick_key_moments(rows, 2).map((row) => row.text)).toEqual(['a', 'c']);
	});
});

describe('topic_description', () => {
	it('counts episodes and videos and names the latest', () => {
		expect(topic_description('CSS', { episodes: 78, videos: 1 }, 'Grid')).toBe(
			'78 episodes and 1 video about CSS from Syntax, the web development podcast with Wes Bos and Scott Tolinski. Latest: Grid.'
		);
	});
});

describe('guest_description', () => {
	it('names the guest, where they work and an episode', () => {
		expect(guest_description({ name: 'Ada', of: 'Supabase' }, ['Postgres', 'Auth'])).toBe(
			'Ada (Supabase) on Syntax, the web development podcast: 2 episodes, including "Postgres".'
		);
		expect(guest_description({ name: 'Ada', of: '' }, [])).toBe(
			'Ada on Syntax, the web development podcast.'
		);
	});
});
