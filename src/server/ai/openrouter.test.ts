import { describe, expect, it } from 'vitest';
import { read_chat_message, read_chat_usage } from './openrouter';

describe('read_chat_message', () => {
	it('reads the first choice, or null for anything else', () => {
		expect(read_chat_message({ choices: [{ message: { content: '{"a":1}' } }] })).toBe('{"a":1}');
		expect(read_chat_message({ choices: [] })).toBeNull();
		expect(read_chat_message({ error: 'nope' })).toBeNull();
		expect(read_chat_message(null)).toBeNull();
	});
});

describe('read_chat_usage', () => {
	it('reads the tokens and the cost', () => {
		const usage = { prompt_tokens: 7812, completion_tokens: 1934, cost: 0.0699 };
		expect(read_chat_usage({ usage })).toEqual({
			prompt_tokens: 7812,
			completion_tokens: 1934,
			cost_usd: 0.0699
		});
	});

	it('counts what the provider bills when we bring our own key', () => {
		// The shape OpenRouter sent for a real call on 2026-11-20
		const usage = {
			prompt_tokens: 17,
			completion_tokens: 4,
			cost: 0,
			is_byok: true,
			cost_details: { upstream_inference_cost: 0.000148 }
		};
		expect(read_chat_usage({ usage })?.cost_usd).toBeCloseTo(0.000148);
	});

	it('has no cost when OpenRouter gives none', () => {
		expect(read_chat_usage({ usage: { prompt_tokens: 1, completion_tokens: 1 } })?.cost_usd).toBe(
			null
		);
	});

	it('is null without usage, or with usage it can’t read', () => {
		expect(read_chat_usage({ choices: [] })).toBeNull();
		expect(read_chat_usage({ usage: { prompt_tokens: 'many' } })).toBeNull();
		expect(read_chat_usage(null)).toBeNull();
	});
});
