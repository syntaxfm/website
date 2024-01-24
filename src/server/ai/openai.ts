import { formatAsTranscript, getSlimUtterances } from '$server/transcripts/utils';
import type { Prisma } from '@prisma/client';
import { encode } from 'gpt-3-encoder';
import { Configuration, OpenAIApi, type CreateChatCompletionRequest } from 'openai';
import wait from 'waait';
import { anthropic_completion, convert_openai_to_anthropic } from './anthropic';
import { createCondensePrompt, summarizePrompt, summarizePrompt2 } from './prompts';
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
	const inputTokensLength = encode(`${transcript} ${summarizePrompt}`).length;
	// If its under the limit, return the transcript as is
	if (inputTokensLength < TOKEN_INPUT_LIMIT || options.skip) {
		console.log(
			`========== Skipping condensing show ${show.number} - Size is ${inputTokensLength} and acceptable ============`
		);
		return show.utterances;
	}
	console.log(`========== Condensing show ${show.number} ============`);
	// Figure out how many hunks we need to split this string into
	console.log(`inputTokensLength size: ${inputTokensLength}`);
	console.log(`Token input limit: ${TOKEN_INPUT_LIMIT}`);
	const factorSmaller = 1 - TOKEN_INPUT_LIMIT / inputTokensLength;
	console.log(`Factor smaller: ${factorSmaller}`);
	// Group utterances
	const slimUtterances = getSlimUtterances(show.utterances, show.number, false);
	console.log(slimUtterances.length, show.utterances.length);
	// Split the transcript into hunks
	const utteranceFuncs = slimUtterances.map((utterance, index) => {
		return async function getCondenseUtterance(): Promise<SlimUtterance> {
			// Wait a random amount of time to avoid rate limiting. Between 0 and 10 seconds
			const waitTime = Math.floor(Math.random() * 10000);
			await wait(waitTime);
			console.time(`Condensing ${index} of ${slimUtterances.length}`);
			const size = encode(utterance.transcript).length;
			// If under 50 chars, leave it alone. Return it via a promise
			if (utterance.transcript.length < CONDENSE_THRESHOLD) {
				console.log(`Skipping condensing of ${index} of ${slimUtterances.length}`);
				return Promise.resolve(utterance);
			}
			// If it's over 50 chars, condense it via openAI
			const input: CreateChatCompletionRequest = {
				model: 'gpt-3.5-turbo', // Summarize
				messages: [
					// { "role": "system", "content": `You are a helpful service that condenses text.` },
					{ role: 'system', content: createCondensePrompt(`${Math.floor(factorSmaller * 100)}%`) },
					{ role: 'user', content: utterance.transcript }
				],
				max_tokens: Math.round(size * factorSmaller)
				// "temperature": 0.3
			};
			console.log(`Condensing`, index, `of`, slimUtterances.length);
			const completion = await openai.createChatCompletion(input).catch((err) => {
				// Catch the error in transcribing so we can at least save the utterance without the condensed transcript
				console.log(`❗️ Error Condensing`, index, `of`, slimUtterances.length);
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
				slimUtterances.length,
				`Condensed from ${original} to ${smaller} tokens - ${Math.round(
					(smaller / original) * 100
				)}% of original`
			);
			console.timeEnd(`Condensing ${index} of ${slimUtterances.length}`);
			// Return the modifined utterance
			return utterance;
		};
	});
	// Run the functions in parallel
	const utteranceResults = await Promise.allSettled(utteranceFuncs.map((func) => func()));
	console.log('Done condensing');
	// Get the results
	const utterances = utteranceResults
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
	const slimUtterance = getSlimUtterances(show.transcript?.utterances, show.number);
	const transcript = formatAsTranscript(slimUtterance);
	// Condense
	const slimUtterancesWithCondensed = await condense(
		transcript,
		{
			name: show.title,
			number: show.number,
			utterances: slimUtterance
		},
		{
			// anthropic doesnt need to condense
			skip: provider === 'anthropic'
		}
	);
	const condensedTranscript = formatAsTranscript(slimUtterancesWithCondensed);

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
			{ role: 'user', content: summarizePrompt2 },
			{ role: 'user', content: `<transcript>${condensedTranscript}</transcript>` },
			{ role: 'user', content: `Remember to only return JSON in the format specified` }
		]
	};
	console.log(`Creating AI notes for ${show.number}`);
	if (provider === 'anthropic') {
		console.log(`Using anthropic for ${show.number}`);
		const anthropicInput = convert_openai_to_anthropic(input);
		const anthropicResult = await anthropic_completion(anthropicInput);
		console.log(anthropicResult);
		const startIndex = anthropicResult.completion.indexOf('{');
		const endIndex = anthropicResult.completion.lastIndexOf('}');
		const jsonPart = anthropicResult.completion.substring(startIndex, endIndex + 1);
		console.log(`JSON Part: ${jsonPart}`);
		const aparsed = JSON.parse(jsonPart) as AIPodcastSummaryResponse;
		return { ...aparsed, provider: 'anthropic' };
	}
	// OpenAI
	console.log(`Using openai for ${show.number}`);
	const completion = await openai.createChatCompletion(input).catch((err) => {
		console.dir(err.response.data.error, { depth: null });
	});
	const maybeJSON = completion?.data.choices.at(0)?.message?.content;
	console.log(maybeJSON);
	const parsed = JSON.parse(maybeJSON || '') as AIPodcastSummaryResponse;
	return { ...parsed, provider: 'gpt3.5' };
}
