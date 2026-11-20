// OpenRouter: models by name over an OpenAI-style chat API, with OPENROUTER_API_KEY. Tagging,
// caption cleanup and issue report triage use it.
import * as v from 'valibot';

export const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';

// What a request used and cost, which OpenRouter adds when asked with `usage: { include: true }`.
// In US dollars. Our account brings its own Anthropic key, so OpenRouter's own `cost` is (near) 0
// and what Anthropic bills is the upstream cost.
const usage_schema = v.object({
	prompt_tokens: v.number(),
	completion_tokens: v.number(),
	cost: v.optional(v.nullable(v.number())),
	cost_details: v.optional(
		v.nullable(v.object({ upstream_inference_cost: v.optional(v.nullable(v.number())) }))
	)
});

export interface ChatUsage {
	prompt_tokens: number;
	completion_tokens: number;
	// OpenRouter's charge and the upstream provider's together; null when neither is given
	cost_usd: number | null;
}

/** A chat response's usage, or null when it has none */
export function read_chat_usage(response: unknown): ChatUsage | null {
	if (typeof response !== 'object' || response === null || !('usage' in response)) return null;
	const result = v.safeParse(usage_schema, response.usage);
	if (!result.success) return null;
	const { prompt_tokens, completion_tokens, cost, cost_details } = result.output;
	const upstream_cost = cost_details?.upstream_inference_cost;
	const has_cost = typeof cost === 'number' || typeof upstream_cost === 'number';
	return {
		prompt_tokens,
		completion_tokens,
		cost_usd: has_cost ? (cost ?? 0) + (upstream_cost ?? 0) : null
	};
}

/** The first choice's message text from an OpenAI-style chat response, or null. */
export function read_chat_message(response: unknown): string | null {
	if (typeof response !== 'object' || response === null || !('choices' in response)) return null;
	const { choices } = response;
	if (!Array.isArray(choices)) return null;
	const first: unknown = choices[0];
	if (typeof first !== 'object' || first === null || !('message' in first)) return null;
	const { message } = first;
	if (typeof message !== 'object' || message === null || !('content' in message)) return null;
	return typeof message.content === 'string' ? message.content : null;
}
