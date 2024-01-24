import Anthropic from '@anthropic-ai/sdk';
import type { CreateChatCompletionRequest } from 'openai';

export const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_KEY
});

// const promptMap = new Map([
// 	['system', Anthropic.AI_PROMPT],
// 	['user', Anthropic.HUMAN_PROMPT]
// ]);

export function convert_openai_to_anthropic(completion: CreateChatCompletionRequest) {
	const messages = completion.messages.map((message) => {
		return `${Anthropic.HUMAN_PROMPT} ${message.content}`;
	});
	return `${messages.join('')} ${Anthropic.AI_PROMPT}`;
}

export function anthropic_completion(prompt: string) {
	return anthropic.completions.create({
		model: 'claude-2',
		max_tokens_to_sample: 75000,
		prompt
	});
}
