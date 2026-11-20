// Claude reads an issue report (the admin's request, their screenshot and the page facts) and
// writes it up as a GitHub issue a coding agent can act on.
import type Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import * as z from 'zod/v4';
import type { IssueReport } from '#lib/issue_reports/issue_report_schema.ts';
import { get_client } from '$server/ai/anthropic';

const TRIAGE_MODEL = 'claude-opus-5-5';

export const ISSUE_KINDS = ['bug', 'enhancement', 'accessibility', 'performance'] as const;

const triage_schema = z.object({
	title: z
		.string()
		.describe(
			'Imperative and specific, under 70 characters, no trailing period. E.g. "Stop episode titles overflowing the card on phones"'
		),
	kind: z.enum(ISSUE_KINDS),
	summary: z.string().describe('One or two sentences: what needs to change, and where'),
	details: z
		.string()
		.describe(
			'Markdown. For a bug: what happens now, and what should happen instead. For a change: what to change. Short; no headings.'
		),
	acceptance_criteria: z
		.array(z.string())
		.describe('1 to 5 statements a reviewer can check on the page to call this done'),
	open_questions: z
		.array(z.string())
		.describe(
			'Questions the reporter must answer before anyone can build this. Empty when the request is clear enough to build.'
		)
});

export type IssueTriage = z.infer<typeof triage_schema>;

const TRIAGE_SYSTEM_PROMPT = `You turn issue reports from the Syntax website into GitHub issues for the syntaxfm/website repository.

The site is syntax.fm, home of the Syntax podcast: SvelteKit with Svelte 5, deployed as a Cloudflare Worker. Pages live in src/routes, shared components in src/lib, global CSS in src/styles.

An admin selected an area of a page, a screenshot of that area was taken, and the admin wrote a request. You get the request, the screenshot (when there is one) and facts about the page: its route, the viewport, the elements in the selected area (with their Svelte source location when the site ran in development), and any script errors.

A coding agent will pick up your issue and make the change without asking anyone, so the issue has to say exactly what to change and how to tell it's done.

- Keep to what the admin asked for. Don't widen the scope or add fixes they didn't ask for.
- Use the screenshot and the page facts to make the request concrete: name the element, the page and the viewport where it happens. Don't guess at causes or files the facts don't show.
- The repository is public. Never copy personal data from the screenshot into the issue: names or emails of listeners, private messages, account details.
- Write plainly and briefly.`;

function triage_message(report: IssueReport): Anthropic.Beta.BetaMessageParam {
	const content: Anthropic.Beta.BetaContentBlockParam[] = [];
	if (report.screenshot) {
		content.push({
			type: 'image',
			source: {
				type: 'base64',
				media_type: report.screenshot.media_type,
				data: report.screenshot.base64
			}
		});
	}
	content.push({
		type: 'text',
		text: [
			`<request>\n${report.request}\n</request>`,
			`<page>\n${JSON.stringify(report.page, null, 2)}\n</page>`,
			report.screenshot ? '' : 'There is no screenshot: the browser could not take one.'
		]
			.filter(Boolean)
			.join('\n\n')
	});
	return { role: 'user', content };
}

export async function triage_issue_report(report: IssueReport): Promise<IssueTriage> {
	// fallbacks: 'default' re-runs a refused request on a suitable model
	const response = await get_client().beta.messages.parse({
		model: TRIAGE_MODEL,
		max_tokens: 16000,
		betas: ['server-side-fallback-2026-07-01'],
		fallbacks: 'default',
		output_config: { effort: 'medium', format: betaZodOutputFormat(triage_schema) },
		system: TRIAGE_SYSTEM_PROMPT,
		messages: [triage_message(report)]
	});

	if (response.stop_reason === 'refusal') {
		throw new Error(
			`Claude declined to triage the report (${response.stop_details?.category ?? 'no category'})`
		);
	}
	if (response.stop_reason === 'max_tokens') {
		throw new Error('Claude hit max_tokens before finishing the triage');
	}
	if (!response.parsed_output) {
		throw new Error('Claude’s triage did not match the issue schema');
	}
	return response.parsed_output;
}
