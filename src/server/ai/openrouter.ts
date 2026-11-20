// OpenRouter: models by name over an OpenAI-style chat API, with OPENROUTER_API_KEY. Tagging,
// caption cleanup and issue report triage use it.

export const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';

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
