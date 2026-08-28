import { Configuration, OpenAIApi, type CreateChatCompletionRequest } from 'openai';

export const ORCAROUTER_API_BASE = 'https://api.orcarouter.ai/v1';
export const MODEL = 'orcarouter/auto';

const configuration = new Configuration({
	apiKey: process.env.ORCAROUTER_API_KEY,
	basePath: ORCAROUTER_API_BASE
});
export const orcarouter = new OpenAIApi(configuration);

export async function orca_completion(input: CreateChatCompletionRequest) {
	return orcarouter.createChatCompletion(input);
}
