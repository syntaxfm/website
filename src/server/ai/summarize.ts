import { openai } from './openai';

// split the transcript on blank lines
export type TranscriptBlock = {
	speaker: string;
	time: string;
	lines: string;
};

export async function summarize(block: TranscriptBlock) {
	const prompt = `
Create a detailed summary of this text. Provide only the summary and avoid introducing it with a title or other text.

${block.lines}
`;

	const response = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		max_tokens: 20,
		messages: [{ role: 'user', content: prompt }]
	});
	return {
		...block,
		summary: response.choices.at(0)?.message?.content
	};
}
