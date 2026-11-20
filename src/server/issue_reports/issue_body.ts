// The GitHub issue an issue report becomes: Claude's triage first, then the admin's own words, the
// screenshot, and the page facts a coding agent needs to find the code.
import type {
	IssueReport,
	IssueReportPage,
	PageElement
} from '#lib/issue_reports/issue_report_schema.ts';
import type { IssueTriage } from './triage';

// Every issue from the Report button carries it, so the agent that fixes them can find them
export const SITE_REPORT_LABEL = 'site-report';
// The repository's existing label for issues waiting on the reporter
export const NEEDS_INFO_LABEL = 'await additionalInfo()';

const KIND_LABELS: Record<IssueTriage['kind'], string> = {
	bug: 'bug',
	enhancement: 'enhancement',
	accessibility: 'A11y',
	performance: '🐇 Perf'
};

export type IssueScreenshot =
	| { status: 'stored'; url: string; is_admin_only: boolean }
	| { status: 'failed'; reason: string }
	| { status: 'none' };

export function issue_labels(triage: IssueTriage): string[] {
	const labels = [SITE_REPORT_LABEL, KIND_LABELS[triage.kind]];
	if (triage.open_questions.length > 0) labels.push(NEEDS_INFO_LABEL);
	return labels;
}

/** The folder a SvelteKit route id lives in, e.g. `/(site)/about` → `src/routes/(site)/about/` */
export function route_directory(route_id: string): string {
	return `src/routes${route_id === '/' ? '' : route_id}/`;
}

// Inline code that survives backticks in the text
function code(text: string): string {
	const fence = text.includes('`') ? '``' : '`';
	return `${fence}${text}${fence}`;
}

function quote(text: string): string {
	return text
		.split('\n')
		.map((line) => `> ${line}`.trimEnd())
		.join('\n');
}

function list(items: string[], checkbox = false): string {
	return items.map((item) => `- ${checkbox ? '[ ] ' : ''}${item}`).join('\n');
}

function describe_selection(page: IssueReportPage): string {
	if (!page.selection) return 'the whole viewport';
	const { x, y, width, height } = page.selection;
	const round = Math.round;
	return `${round(width)}×${round(height)} at (${round(x)}, ${round(y)}) in the viewport, (${round(x + page.scroll.x)}, ${round(y + page.scroll.y)}) on the page`;
}

function describe_element(element: PageElement): string {
	const parts = [
		element.kind === 'area' ? `area ${code(element.selector)}` : code(element.selector)
	];
	if (element.text) parts.push(`“${element.text}”`);
	if (element.source) parts.push(`— ${code(element.source)}`);
	return parts.join(' ');
}

function describe_browser(page: IssueReportPage): string {
	const { browser, viewport } = page;
	const name = browser.brand
		? `${browser.brand}${browser.platform ? ` on ${browser.platform}` : ''}`
		: code(browser.user_agent);
	return [
		name,
		`${viewport.width}×${viewport.height} viewport at ${viewport.device_pixel_ratio}x`,
		browser.is_mobile ? 'mobile' : null,
		`${page.color_scheme} mode`,
		page.theme,
		page.reduced_motion ? 'reduced motion' : null,
		browser.language,
		browser.time_zone
	]
		.filter(Boolean)
		.join(' · ');
}

function describe_screenshot(screenshot: IssueScreenshot): string {
	switch (screenshot.status) {
		case 'stored':
			// GitHub can't show an admin-only image, so it gets a link instead
			return screenshot.is_admin_only
				? `[Screenshot](${screenshot.url}) (admins only: it shows an admin page. Agents: fetch it with \`Authorization: Bearer $CRON_SECRET\`.)`
				: `![Selected area](${screenshot.url})`;
		case 'failed':
			return `The screenshot couldn’t be stored: ${screenshot.reason}`;
		case 'none':
			return 'The browser didn’t take a screenshot.';
	}
}

export function build_issue_body({
	report,
	triage,
	screenshot,
	reporter_name
}: {
	report: IssueReport;
	triage: IssueTriage;
	screenshot: IssueScreenshot;
	reporter_name: string;
}): string {
	const { page } = report;
	const where = [
		`- Page: [${page.title || page.url}](${page.url})`,
		page.route_id
			? `- Route: ${code(page.route_id)} in ${code(route_directory(page.route_id))}`
			: '- Route: none (an error page)',
		`- Selection: ${describe_selection(page)}`
	];
	if (page.elements.length > 0) {
		where.push(
			'- Elements:',
			...page.elements.map((element) => `  - ${describe_element(element)}`)
		);
	}

	const sections = [
		triage.summary,
		triage.details,
		`### Done when\n\n${list(triage.acceptance_criteria, true)}`,
		triage.open_questions.length > 0
			? `### Open questions\n\n${list(triage.open_questions)}`
			: null,
		`### Request from ${reporter_name}\n\n${quote(report.request)}`,
		`### Screenshot\n\n${describe_screenshot(screenshot)}`,
		`### Where\n\n${where.join('\n')}`,
		page.errors.length > 0
			? `### Script errors before the report\n\n${list(
					page.errors.map(
						(page_error) =>
							`${page_error.at}: ${code(page_error.message)}${page_error.source ? ` at ${code(page_error.source)}` : ''}`
					)
				)}`
			: null,
		`### Browser\n\n${describe_browser(page)}\n\nReported ${page.captured_at} from ${new URL(page.url).host}.`,
		`<details>\n<summary>Page facts (JSON)</summary>\n\n\`\`\`json\n${JSON.stringify(page, null, 2)}\n\`\`\`\n\n</details>`
	];

	return sections.filter((section): section is string => Boolean(section)).join('\n\n');
}
