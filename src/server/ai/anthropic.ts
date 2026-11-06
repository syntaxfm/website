import Anthropic from '@anthropic-ai/sdk';
import type { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';
import { ANTHROPIC_KEY } from '$app/env/private';

const MODEL = 'claude-opus-5-5';

let client: Anthropic | undefined;

// Created on first use, so the module loads (and builds) without a key
function get_client(): Anthropic {
	if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_KEY is not set');
	return (client ??= new Anthropic({ apiKey: ANTHROPIC_KEY }));
}

type AnthropicPrompt = {
	system: string;
	messages: Anthropic.Beta.BetaMessageParam[];
};

/** The same prompt as an OpenAI chat request: system messages become the system prompt. */
export function convert_openai_to_anthropic(
	completion: ChatCompletionCreateParamsNonStreaming
): AnthropicPrompt {
	const system: string[] = [];
	const messages: Anthropic.Beta.BetaMessageParam[] = [];

	for (const message of completion.messages) {
		if (typeof message.content !== 'string') {
			throw new TypeError(`Only text ${message.role} messages can be sent to Claude`);
		}
		if (message.role === 'system' || message.role === 'developer') {
			system.push(message.content);
		} else if (message.role === 'user' || message.role === 'assistant') {
			messages.push({ role: message.role, content: message.content });
		} else {
			throw new TypeError(`Unsupported message role for Claude: ${message.role}`);
		}
	}

	return { system: system.join('\n\n'), messages };
}

/** Claude's text answer to the prompt. */
export async function anthropic_completion({ system, messages }: AnthropicPrompt): Promise<string> {
	// Streamed: the summary is long, and a non-streaming request this size can hit HTTP timeouts.
	// fallbacks: 'default' lets the API re-run a refused request on a suitable model.
	const response = await get_client()
		.beta.messages.stream({
			model: MODEL,
			max_tokens: 64000,
			betas: ['server-side-fallback-2026-07-01'],
			fallbacks: 'default',
			system,
			messages
		})
		.finalMessage();

	if (response.stop_reason === 'refusal') {
		throw new Error(
			`Claude declined the request (${response.stop_details?.category ?? 'no category'})`
		);
	}
	if (response.stop_reason === 'max_tokens') {
		throw new Error('Claude hit max_tokens before finishing the summary');
	}

	return response.content
		.filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
		.map((block) => block.text)
		.join('');
}
