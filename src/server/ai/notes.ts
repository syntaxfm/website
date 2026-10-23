import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { formatAsTranscript, getSlimUtterances } from '#utilities/transcripts.js';
import { summarize_prompt } from './prompts';
import type { transcript_without_ai_notes_query } from './queries';

const ai_notes_schema = z.object({
	title: z.string(),
	description: z.string(),
	notes: z.string(),
	summary: z.array(z.object({ time: z.string(), text: z.string(), description: z.string() })),
	tweets: z.array(z.string()),
	topics: z.array(z.string()),
	links: z.array(z.object({ name: z.string(), url: z.string(), timestamp: z.string() })),
	guests: z.array(z.string())
});

export type AiNotes = z.infer<typeof ai_notes_schema>;

const { $schema: _schema, ...ai_notes_json_schema } = z.toJSONSchema(ai_notes_schema);

export async function generate_ai_notes(
	show: Prisma.ShowGetPayload<typeof transcript_without_ai_notes_query>
): Promise<AiNotes> {
	const api_key = process.env.OPENROUTER_API_KEY;
	if (!api_key) {
		throw new Error('Please set the OPENROUTER_API_KEY environment variable.');
	}
	if (!show.transcript?.utterances) {
		throw new Error(`No transcript found for show ${show.number}`);
	}
	const slim_utterances = getSlimUtterances(show.transcript.utterances, show.number);
	const transcript = formatAsTranscript(slim_utterances);

	console.log(`Creating AI notes for ${show.number}`);
	const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${api_key}`,
			'Content-Type': 'application/json',
			'HTTP-Referer': 'https://syntax.fm',
			'X-OpenRouter-Title': 'Syntax'
		},
		body: JSON.stringify({
			model: 'anthropic/claude-sonnet-5.5',
			max_tokens: 32000,
			messages: [
				{
					role: 'system',
					content:
						'You summarize web development podcasts. Your tone is casual and humorous. Syntax is a podcast about web development, available at https://Syntax.fm'
				},
				{
					role: 'user',
					content: `This episode is #${show.number} entitled ${show.title}\n\n<transcript>${transcript}</transcript>\n\n${summarize_prompt}`
				}
			],
			response_format: {
				type: 'json_schema',
				json_schema: { name: 'ai_notes', strict: true, schema: ai_notes_json_schema }
			},
			// OpenRouter otherwise routes to providers that drop response_format, and the reply isn't JSON
			provider: { require_parameters: true }
		})
	});

	if (!response.ok) {
		throw new Error(
			`OpenRouter request for show ${show.number} failed: ${response.status} ${await response.text()}`
		);
	}
	const completion = await response.json();
	const choice = completion.choices?.[0];
	if (!choice?.message?.content) {
		throw new Error(
			`AI notes for show ${show.number} returned no content (finish_reason: ${choice?.finish_reason})`
		);
	}
	return ai_notes_schema.parse(JSON.parse(choice.message.content));
}
