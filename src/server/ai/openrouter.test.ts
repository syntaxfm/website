import { describe, expect, it } from 'vitest';
import { read_chat_message } from './openrouter';

describe('read_chat_message', () => {
	it('reads the first choice, or null for anything else', () => {
		expect(read_chat_message({ choices: [{ message: { content: '{"a":1}' } }] })).toBe('{"a":1}');
		expect(read_chat_message({ choices: [] })).toBeNull();
		expect(read_chat_message({ error: 'nope' })).toBeNull();
		expect(read_chat_message(null)).toBeNull();
	});
});
