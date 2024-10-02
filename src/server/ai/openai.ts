import { formatAsTranscript, getSlimUtterances } from '$server/transcripts/utils';
import type { Prisma } from '@prisma/client';
import { encode } from 'gpt-3-encoder';
import { Configuration, OpenAIApi, type CreateChatCompletionRequest } from 'openai';
import wait from 'waait';
import { anthropic_completion, convert_openai_to_anthropic } from './anthropic';
import { create_condensed_prompt, summarize_prompt, summarize_prompt_2 } from './prompts';
import type { AIPodcastSummaryResponse, transcript_without_ai_notes_query } from './queries';
import type { SlimUtterance, TranscribedShow } from '../transcripts/types';

export const TOKEN_LIMIT = 7000;
export const COMPLETION_TOKEN_IDEAL = 1500; // how many tokens we should reserve to the completion - otherwise the responses are poor quality
const TOKEN_INPUT_LIMIT = TOKEN_LIMIT - COMPLETION_TOKEN_IDEAL;
// export const MODEL = 'gpt-3.5-turbo-16k'; // Was gpt-4 before token limit was increased
export const MODEL = 'gpt-4';
export const EMBEDDING_MODEL = 'text-embedding-ada-002';
export const CONDENSE_THRESHOLD = 100;
const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY
});
export const openai = new OpenAIApi(configuration);

export async function condense(
	transcript: string,
	show: TranscribedShow,
	options: {
		skip: boolean;
	}
): Promise<SlimUtterance[]> {
	// Figure out how large the input is
	const input_tokens_length = encode(`${transcript} ${summarize_prompt}`).length;
	// If its under the limit, return the transcript as is
	if (input_tokens_length < TOKEN_INPUT_LIMIT || options.skip) {
		console.log(
			`========== Skipping condensing show ${show.number} - Size is ${input_tokens_length} and acceptable ============`
		);
		return show.utterances;
	}
	console.log(`========== Condensing show ${show.number} ============`);
	// Figure out how many hunks we need to split this string into
	console.log(`input Tokens size: ${input_tokens_length}`);
	console.log(`Token input limit: ${TOKEN_INPUT_LIMIT}`);
	const factor_smaller = 1 - TOKEN_INPUT_LIMIT / input_tokens_length;
	console.log(`Factor smaller: ${factor_smaller}`);
	// Group utterances
	const slim_utterances = getSlimUtterances(show.utterances, show.number, false);
	console.log(slim_utterances.length, show.utterances.length);
	// Split the transcript into hunks
	const utterance_funcs = slim_utterances.map((utterance, index) => {
		return async function getCondenseUtterance(): Promise<SlimUtterance> {
			// Wait a random amount of time to avoid rate limiting. Between 0 and 10 seconds
			const wait_time = Math.floor(Math.random() * 10000);
			await wait(wait_time);
			console.time(`Condensing ${index} of ${slim_utterances.length}`);
			const size = encode(utterance.transcript).length;
			// If under 50 chars, leave it alone. Return it via a promise
			if (utterance.transcript.length < CONDENSE_THRESHOLD) {
				console.log(`Skipping condensing of ${index} of ${slim_utterances.length}`);
				return Promise.resolve(utterance);
			}
			// If it's over 50 chars, condense it via openAI
			const input: CreateChatCompletionRequest = {
				model: 'gpt-3.5-turbo', // Summarize
				messages: [
					// { "role": "system", "content": `You are a helpful service that condenses text.` },
					{
						role: 'system',
						content: create_condensed_prompt(`${Math.floor(factor_smaller * 100)}%`)
					},
					{ role: 'user', content: utterance.transcript }
				],
				max_tokens: Math.round(size * factor_smaller)
				// "temperature": 0.3
			};
			console.log(`Condensing`, index, `of`, slim_utterances.length);
			const completion = await openai.createChatCompletion(input).catch((err) => {
				// Catch the error in transcribing so we can at least save the utterance without the condensed transcript
				console.log(`❗️ Error Condensing`, index, `of`, slim_utterances.length);
				console.dir(err.response.data);
				console.dir(err.response.headers);
			});
			const condensed = completion?.data?.choices?.at(0)?.message?.content;
			// Inject the condensed transcript into the utterance
			if (condensed) {
				utterance.condensedTranscript = condensed;
			}
			if (condensed && condensed.length > utterance.transcript.length) {
				console.log(`Condensed transcript is longer than original transcript.
        Condensed: ${condensed}
        Original: ${utterance.transcript}
        `);
				return Promise.resolve(utterance);
			}
			const smaller = encode(condensed || '').length;
			const original = encode(utterance.transcript).length;
			console.log(
				index,
				'/',
				slim_utterances.length,
				`Condensed from ${original} to ${smaller} tokens - ${Math.round(
					(smaller / original) * 100
				)}% of original`
			);
			console.timeEnd(`Condensing ${index} of ${slim_utterances.length}`);
			// Return the modifined utterance
			return utterance;
		};
	});
	// Run the functions in parallel
	const utterance_results = await Promise.allSettled(utterance_funcs.map((func) => func()));
	console.log('Done condensing');
	// Get the results
	const utterances = utterance_results
		.filter((result): result is PromiseFulfilledResult<SlimUtterance> => {
			return result.status === 'fulfilled';
		})
		.map((result) => result.value);

	console.log(`Finished Condensing ${show.number}`);
	return utterances;
}

export async function generate_ai_notes(
	show: Prisma.ShowGetPayload<typeof transcript_without_ai_notes_query>,
	provider: 'openai' | 'anthropic' = 'anthropic'
) {
	if (!show || !show.transcript?.utterances) {
		throw new Error(`No transcript found for show ${show.number}`);
	}
	const slim_utterance = getSlimUtterances(show.transcript?.utterances, show.number);
	const transcript = formatAsTranscript(slim_utterance);
	// Condense
	const slim_utterances_with_condensed = await condense(
		transcript,
		{
			name: show.title,
			number: show.number,
			utterances: slim_utterance
		},
		{
			// anthropic doesnt need to condense
			skip: provider === 'anthropic'
		}
	);
	const condensed_transcript = formatAsTranscript(slim_utterances_with_condensed);

	const input: CreateChatCompletionRequest = {
		// model: 'gpt-4',
		model: 'gpt-3.5-turbo-16k',
		temperature: 0,
		messages: [
			{
				role: 'system',
				content:
					'You summarize web development podcasts and output the result as JSON format. Your tone is casual and humorous.'
			},
			{
				role: 'user',
				content: 'Syntax is a podcast about web development. Available at https://Syntax.fm'
			},
			{ role: 'user', content: `This episode is #${show.number} entitled ${show.title}` },
			{ role: 'user', content: summarize_prompt_2 },
			{ role: 'user', content: `<transcript>${condensed_transcript}</transcript>` },
			{ role: 'user', content: `Remember to only return JSON in the format specified` }
		]
	};
	console.log(`Creating AI notes for ${show.number}`);
	if (provider === 'anthropic') {
		console.log(`Using anthropic for ${show.number}`);
		const anthropic_input = convert_openai_to_anthropic(input);
		const anthropic_result = await anthropic_completion(anthropic_input);
		console.log(anthropic_result);
		const start_index = anthropic_result.completion.indexOf('{');
		const end_index = anthropic_result.completion.lastIndexOf('}');
		const json_part = anthropic_result.completion.substring(start_index, end_index + 1);
		console.log(`JSON Part: ${json_part}`);
		const aparsed = JSON.parse(json_part) as AIPodcastSummaryResponse;
		return { ...aparsed, provider: 'anthropic' };
	}
	// OpenAI
	console.log(`Using openai for ${show.number}`);
	const completion = await openai.createChatCompletion(input).catch((err) => {
		console.dir(err.response.data.error, { depth: null });
	});
	const maybe_json = completion?.data.choices.at(0)?.message?.content;
	console.log(maybe_json);
	const parsed = JSON.parse(maybe_json || '') as AIPodcastSummaryResponse;
	return { ...parsed, provider: 'gpt3.5' };
}
