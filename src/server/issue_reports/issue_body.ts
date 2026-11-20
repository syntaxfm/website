// The GitHub issue an issue report becomes: Claude's triage first, then the admin's own words, the
// screenshots, and the page facts a coding agent needs to find the code.
import type {
	IssueReport,
	IssueReportPage,
	PageElement,
	ScreenshotKind
} from '#lib/issue_reports/issue_report_schema.ts';
import type { ChatUsage } from '$server/ai/openrouter';
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

export type IssueScreenshots = Record<ScreenshotKind, IssueScreenshot>;

// Who filed it. Only signed-in admins can.
export interface Reporter {
	name: string;
	roles: string[];
}

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
	if (!page.selection) return 'the whole screen';
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

function size(dimensions: { width: number; height: number }): string {
	return `${Math.round(dimensions.width)}×${Math.round(dimensions.height)}`;
}

function describe_environment(page: IssueReportPage, reporter: Reporter): string {
	const { browser, window } = page;
	const zoomed = window.visual_viewport && window.visual_viewport.scale !== 1;
	return list([
		`Browser: ${[
			browser.name,
			browser.is_mobile ? 'mobile' : null,
			browser.is_touch ? 'touch' : null
		]
			.filter(Boolean)
			.join(' · ')}`,
		`Window: ${[
			`viewport ${size(window.viewport)}`,
			zoomed && window.visual_viewport
				? `pinch-zoomed ${window.visual_viewport.scale}x to ${size(window.visual_viewport)}`
				: null,
			`browser window ${size(window.outer)}`,
			`screen ${size(window.screen)}${window.screen.orientation ? ` ${window.screen.orientation}` : ''}`,
			`page ${size(window.document)}`,
			`${window.device_pixel_ratio}x pixels`
		]
			.filter(Boolean)
			.join(' · ')}`,
		`Look: ${[
			`${page.color_scheme} mode`,
			page.theme,
			page.reduced_motion ? 'reduced motion' : null
		]
			.filter(Boolean)
			.join(' · ')}`,
		`Locale: ${browser.language} · ${browser.time_zone}`,
		`Signed in as ${reporter.name} (${reporter.roles.join(', ') || 'no roles'})`,
		`User agent: ${code(browser.user_agent)}`
	]);
}

const SCREENSHOT_LABELS: Record<keyof IssueScreenshots, string> = {
	selection: 'Selection',
	screen: 'Screen',
	page: 'Full page'
};

// One screenshot's markdown, or null when there's none
function describe_screenshot(kind: keyof IssueScreenshots, screenshot: IssueScreenshot) {
	const label = SCREENSHOT_LABELS[kind];
	switch (screenshot.status) {
		case 'stored':
			// GitHub can't show an admin-only image, so it gets a link instead
			return screenshot.is_admin_only
				? `[${label}](${screenshot.url})`
				: `![${label}](${screenshot.url})`;
		case 'failed':
			return `The ${label.toLowerCase()} screenshot couldn’t be stored: ${screenshot.reason}`;
		case 'none':
			return null;
	}
}

// Which rows of the page the full-page screenshot shows, when it's a slice of a very long page
function describe_full_page_rows({ full_page, window }: IssueReportPage): string {
	const bottom = full_page.top + full_page.height;
	if (full_page.top === 0 && bottom >= window.document.height) return '';
	const format = (pixels: number) => Math.round(pixels).toLocaleString('en-US');
	return `, rows ${format(full_page.top)}–${format(bottom)} of ${format(window.document.height)}`;
}

function describe_screenshots(screenshots: IssueScreenshots, page_facts: IssueReportPage): string {
	const selection = describe_screenshot('selection', screenshots.selection);
	const screen = describe_screenshot('screen', screenshots.screen);
	const page = describe_screenshot('page', screenshots.page);
	const is_admin_only = Object.values(screenshots).some(
		(screenshot) => screenshot.status === 'stored' && screenshot.is_admin_only
	);
	const parts = [
		selection ? `**Selection**\n\n${selection}` : null,
		screen ? `**Screen**\n\n${screen}` : null,
		// Tall, so folded away. The screen is outlined dashed on it, the selection solid.
		page
			? `<details>\n<summary>Full page${describe_full_page_rows(page_facts)} (screen dashed, selection solid)</summary>\n\n${page}\n\n</details>`
			: null,
		is_admin_only
			? 'Admins only: they show an admin page. Agents: fetch them with `Authorization: Bearer $CRON_SECRET`.'
			: null
	].filter(Boolean);
	return parts.length > 0
		? parts.join('\n\n')
		: 'No screenshots: the headless browser couldn’t take them.';
}

// What Claude's triage used and cost, e.g. "Triage: 7,812 tokens in, 1,934 out, $0.0699"
export function describe_triage_usage(usage: ChatUsage | null): string {
	if (!usage) return 'Triage: OpenRouter didn’t say what it used.';
	const count = (tokens: number) => tokens.toLocaleString('en-US');
	const cost = usage.cost_usd === null ? '' : `, $${usage.cost_usd.toFixed(4)}`;
	return `Triage: ${count(usage.prompt_tokens)} tokens in, ${count(usage.completion_tokens)} out${cost}.`;
}

export function build_issue_body({
	report,
	triage,
	triage_usage,
	screenshots,
	reporter
}: {
	report: IssueReport;
	triage: IssueTriage;
	triage_usage: ChatUsage | null;
	screenshots: IssueScreenshots;
	reporter: Reporter;
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
		`### Request from ${reporter.name}\n\n${quote(report.request)}`,
		`### Screenshots\n\n${describe_screenshots(screenshots, page)}`,
		`### Where\n\n${where.join('\n')}`,
		page.errors.length > 0
			? `### Script errors before the report\n\n${list(
					page.errors.map(
						(page_error) =>
							`${page_error.at}: ${code(page_error.message)}${page_error.source ? ` at ${code(page_error.source)}` : ''}`
					)
				)}`
			: null,
		`### Browser and window\n\n${describe_environment(page, reporter)}\n\nReported ${page.captured_at} from ${new URL(page.url).host}. ${describe_triage_usage(triage_usage)}`,
		`<details>\n<summary>Page facts (JSON)</summary>\n\n\`\`\`json\n${JSON.stringify(page, null, 2)}\n\`\`\`\n\n</details>`
	];

	return sections.filter((section): section is string => Boolean(section)).join('\n\n');
}
