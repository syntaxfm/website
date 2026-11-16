import format_time, { tsToS } from '$utilities/format_time';
import { group_by_topic, passage_ids, type TopicSummary } from './utils';

// The transcript as Markdown for AI agents and anyone reading it raw (/transcript.md). Every line
// links to its passage on the HTML transcript page, so a quote can cite the exact moment.

export type MarkdownPassage = { start: number; speaker: string; text: string };

export type TranscriptMarkdownInput = {
	show_number: number;
	title: string;
	// The HTML transcript page and the episode page, absolute
	transcript_url: string;
	episode_url: string;
	published: Date;
	description: string | null;
	topics: readonly TopicSummary[];
	passages: readonly MarkdownPassage[];
};

function one_line(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

export function transcript_markdown(input: TranscriptMarkdownInput): string {
	const ids = passage_ids(input.passages.map((passage) => passage.start));
	const id_by_passage = new Map(input.passages.map((passage, index) => [passage, ids[index]]));

	const lines = [
		`# Transcript: ${one_line(input.title)} (Syntax #${input.show_number})`,
		'',
		`- Transcript page: ${input.transcript_url}`,
		`- Episode: ${input.episode_url}`,
		`- Published: ${input.published.toISOString().slice(0, 10)}`,
		''
	];
	if (input.description) lines.push(`> ${one_line(input.description)}`, '');

	for (const group of group_by_topic(input.passages, input.topics, tsToS)) {
		if (group.topic) lines.push(`## ${one_line(group.topic.text)} (${group.topic.time})`, '');
		for (const passage of group.utterances) {
			const link = `${input.transcript_url}#${id_by_passage.get(passage)}`;
			lines.push(
				`[${format_time(passage.start)}](${link}) **${passage.speaker}:** ${one_line(passage.text)}`,
				''
			);
		}
	}

	return `${lines.join('\n').trimEnd()}\n`;
}
