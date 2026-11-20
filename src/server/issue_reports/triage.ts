// Claude reads an issue report (the admin's request, their screenshot and the page facts) and
// writes it up as a GitHub issue a coding agent can act on. Through OpenRouter, like tagging.
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { OPENROUTER_API_KEY } from '$app/env/private';
import type { IssueReport, Screenshot } from '#lib/issue_reports/issue_report_schema.ts';
import {
	OPENROUTER_CHAT_URL,
	read_chat_message,
	read_chat_usage,
	type ChatUsage
} from '$server/ai/openrouter';

const TRIAGE_MODEL = 'anthropic/claude-opus-5.5';
// OpenRouter sends it to Claude as Anthropic's effort. Opus 5.5 there defaults to high.
const TRIAGE_EFFORT = 'medium';
// Thinking counts against it too; an empty answer would mean it ran out
const TRIAGE_MAX_TOKENS = 16000;
// GitHub's limit on issue titles
const MAX_TITLE_LENGTH = 256;

export const ISSUE_KINDS = ['bug', 'enhancement', 'accessibility', 'performance'] as const;

// What Claude must answer (OpenRouter's strict structured output)
const TRIAGE_JSON_SCHEMA = {
	type: 'object',
	properties: {
		title: {
			type: 'string',
			description:
				'Imperative and specific, under 70 characters, no trailing period. E.g. "Stop episode titles overflowing the card on phones"'
		},
		kind: { type: 'string', enum: [...ISSUE_KINDS] },
		summary: {
			type: 'string',
			description: 'One or two sentences: what needs to change, and where'
		},
		details: {
			type: 'string',
			description:
				'Markdown. For a bug: what happens now, and what should happen instead. For a change: what to change. Short; no headings.'
		},
		acceptance_criteria: {
			type: 'array',
			items: { type: 'string' },
			description: '1 to 5 statements a reviewer can check on the page to call this done'
		},
		open_questions: {
			type: 'array',
			items: { type: 'string' },
			description:
				'Only questions whose answer would change what gets built and that have no sensible default. Usually empty.'
		}
	},
	required: ['title', 'kind', 'summary', 'details', 'acceptance_criteria', 'open_questions'],
	additionalProperties: false
};

// The same answer, checked when it arrives
const triage_schema = v.object({
	title: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(MAX_TITLE_LENGTH)),
	kind: v.picklist(ISSUE_KINDS),
	summary: v.pipe(v.string(), v.trim()),
	details: v.pipe(v.string(), v.trim()),
	acceptance_criteria: v.array(v.pipe(v.string(), v.trim())),
	open_questions: v.array(v.pipe(v.string(), v.trim()))
});

export type IssueTriage = v.InferOutput<typeof triage_schema>;

const TRIAGE_SYSTEM_PROMPT = `You turn issue reports from the Syntax website into GitHub issues for the syntaxfm/website repository.

The site is syntax.fm, home of the Syntax podcast: SvelteKit with Svelte 5, deployed as a Cloudflare Worker. Pages live in src/routes, shared components in src/lib, global CSS in src/styles.

An admin, on a computer or a phone, selected an area of a page and wrote a request. You get the request, screenshots of the selected area and of the whole screen (when the browser could draw them), and facts about the page: its route, the browser, the window and screen sizes, the elements in the selected area (with their Svelte source location when the site ran in development), and any script errors. With no selected area, the admin meant the whole screen.

The screenshots are taken by a headless Chrome that opened the same page at the admin's window size, scroll position and light or dark mode, signed in as them. It loaded the page fresh, so what the admin had opened or typed isn't in them, and a problem only their own browser draws (Safari, say) may not show. Then go by the request and the page facts.

A coding agent will make the change from your issue alone, so the issue has to say exactly what to change and how to tell it's done.

- Keep to what the admin asked for. Don't widen the scope or add fixes they didn't ask for.
- Use the screenshots and the page facts to make the request concrete: name the element, the page, the browser and the screen size where it happens. Don't guess at causes or files the facts don't show.
- An open question holds the issue back until the admin answers, so ask one only when the agent could otherwise build the wrong thing. Where there's a sensible default (keep other screen sizes working, match the site's existing style), write it into the details as the plan instead.
- The repository is public. Never copy personal data from the screenshot into the issue: names or emails of listeners, private messages, account details.
- Write plainly and briefly.`;

type ContentPart =
	| { type: 'text'; text: string }
	| { type: 'image_url'; image_url: { url: string } };

// The selected area and the whole screen, each named. The full page is too tall to read once
// scaled down, so it's only for the issue.
function screenshot_parts(report: IssueReport): ContentPart[] {
	const { selection, screen } = report.screenshots;
	const labelled: [string, Screenshot | null][] = [
		['The selected area:', selection],
		['The whole screen:', screen]
	];
	return labelled.flatMap(([label, screenshot]): ContentPart[] =>
		screenshot
			? [
					{ type: 'text', text: label },
					{
						type: 'image_url',
						image_url: { url: `data:${screenshot.media_type};base64,${screenshot.base64}` }
					}
				]
			: []
	);
}

function triage_user_content(report: IssueReport): ContentPart[] {
	const parts = screenshot_parts(report);
	const text = [
		`<request>\n${report.request}\n</request>`,
		`<page>\n${JSON.stringify(report.page, null, 2)}\n</page>`,
		parts.length > 0 ? '' : 'There are no screenshots: the headless browser could not take them.'
	]
		.filter(Boolean)
		.join('\n\n');
	return [...parts, { type: 'text', text }];
}

export function build_triage_request(report: IssueReport) {
	return {
		model: TRIAGE_MODEL,
		reasoning: { effort: TRIAGE_EFFORT },
		max_tokens: TRIAGE_MAX_TOKENS,
		messages: [
			{ role: 'system', content: TRIAGE_SYSTEM_PROMPT },
			{ role: 'user', content: triage_user_content(report) }
		],
		response_format: {
			type: 'json_schema',
			json_schema: { name: 'issue_triage', strict: true, schema: TRIAGE_JSON_SCHEMA }
		},
		// The tokens and the price come back with the answer, for the issue to show
		usage: { include: true }
	};
}

export async function triage_issue_report(
	report: IssueReport
): Promise<{ triage: IssueTriage; usage: ChatUsage | null }> {
	if (!OPENROUTER_API_KEY) error(503, 'Issues can’t be triaged: OPENROUTER_API_KEY is not set');

	const response = await fetch(OPENROUTER_CHAT_URL, {
		method: 'POST',
		headers: { authorization: `Bearer ${OPENROUTER_API_KEY}`, 'content-type': 'application/json' },
		body: JSON.stringify(build_triage_request(report))
	});
	const text = await response.text();
	if (!response.ok) throw new Error(`OpenRouter ${response.status}: ${text.slice(0, 500)}`);

	const parsed: unknown = JSON.parse(text);
	const answer = read_chat_message(parsed);
	if (!answer) throw new Error(`Claude’s triage came back empty: ${text.slice(0, 500)}`);
	return { triage: v.parse(triage_schema, JSON.parse(answer)), usage: read_chat_usage(parsed) };
}
