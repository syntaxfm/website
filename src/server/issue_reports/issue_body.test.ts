import { describe, expect, it } from 'vitest';
import { SAMPLE_REPORT as report } from '#lib/issue_reports/issue_report.fixture.ts';
import {
	NEEDS_INFO_LABEL,
	SITE_REPORT_LABEL,
	build_issue_body,
	issue_labels,
	route_directory,
	type IssueScreenshots
} from './issue_body';
import type { IssueTriage } from './triage';

const triage: IssueTriage = {
	title: 'Stop episode titles overflowing the card on phones',
	kind: 'bug',
	summary: 'Long episode titles run out of their card at 390px wide.',
	details: 'The title spills past the right edge. It should wrap inside the card.',
	acceptance_criteria: ['At 390px wide the title wraps inside the card'],
	open_questions: []
};

const reporter = { name: 'Scott Tolinski', roles: ['admin'] };
const url = (kind: string) => `https://beta.syntax.fm/issue-screenshots/public/2026-11/${kind}.png`;
const stored: IssueScreenshots = {
	selection: { status: 'stored', url: url('selection'), is_admin_only: false },
	screen: { status: 'stored', url: url('screen'), is_admin_only: false },
	page: { status: 'stored', url: url('page'), is_admin_only: false }
};
const none: IssueScreenshots = {
	selection: { status: 'none' },
	screen: { status: 'none' },
	page: { status: 'none' }
};

describe('issue_labels', () => {
	it('marks every issue as a site report and adds its kind', () => {
		expect(issue_labels(triage)).toEqual([SITE_REPORT_LABEL, 'bug']);
		expect(issue_labels({ ...triage, kind: 'accessibility' })).toEqual([SITE_REPORT_LABEL, 'A11y']);
	});

	it('waits on the reporter when there are open questions', () => {
		expect(issue_labels({ ...triage, open_questions: ['Which card?'] })).toContain(
			NEEDS_INFO_LABEL
		);
	});
});

describe('route_directory', () => {
	it('maps a route id to its folder', () => {
		expect(route_directory('/(site)/show/[show_number]/[slug]')).toBe(
			'src/routes/(site)/show/[show_number]/[slug]/'
		);
		expect(route_directory('/')).toBe('src/routes/');
	});
});

describe('build_issue_body', () => {
	it('leads with the triage and keeps the request word for word', () => {
		const body = build_issue_body({ report, triage, screenshots: none, reporter });
		expect(body.startsWith(triage.summary)).toBe(true);
		expect(body).toContain('- [ ] At 390px wide the title wraps inside the card');
		expect(body).toContain(
			'### Request from Scott Tolinski\n\n> This title is busted on my phone\n> fix it pls'
		);
		expect(body).not.toContain('### Open questions');
	});

	it('says where the selection is and which code made it', () => {
		const body = build_issue_body({ report, triage, screenshots: none, reporter });
		expect(body).toContain('in `src/routes/(site)/show/[show_number]/[slug]/`');
		expect(body).toContain('300×120 at (10, 20) in the viewport, (10, 1220) on the page');
		expect(body).toContain('area `main > section.hero`');
		expect(body).toContain(
			'`section.hero > h1.title` “Some Episode” — `src/routes/(site)/show/[show_number]/[slug]/+page.svelte:12:2`'
		);
		expect(body).toContain('`TypeError: x is undefined`');
		expect(body).toContain('"route_id": "/(site)/show/[show_number]/[slug]"');
	});

	it('names the browser, the window sizes and who was signed in', () => {
		const body = build_issue_body({ report, triage, screenshots: none, reporter });
		expect(body).toContain('- Browser: Safari 18.2 on iOS 18.2 · mobile · touch');
		expect(body).toContain(
			'- Window: viewport 390×664 · browser window 390×844 · screen 390×844 portrait-primary · page 390×9120 · 3x pixels'
		);
		expect(body).toContain('- Signed in as Scott Tolinski (admin)');
	});

	it('mentions pinch zoom only when the page is zoomed', () => {
		const zoomed = {
			...report,
			page: {
				...report.page,
				window: {
					...report.page.window,
					visual_viewport: { width: 195, height: 332, scale: 2 }
				}
			}
		};
		const body = build_issue_body({ report: zoomed, triage, screenshots: none, reporter });
		expect(body).toContain('pinch-zoomed 2x to 195×332');
	});

	it('shows the selection and screen, and folds the full page away', () => {
		const body = build_issue_body({ report, triage, screenshots: stored, reporter });
		expect(body).toContain(`**Selection**\n\n![Selection](${url('selection')})`);
		expect(body).toContain(`**Screen**\n\n![Screen](${url('screen')})`);
		expect(body).toContain(
			`<summary>Full page (screen dashed, selection solid)</summary>\n\n![Full page](${url('page')})`
		);
	});

	it('says which rows a slice of a very long page shows', () => {
		const long_page = {
			...report,
			page: {
				...report.page,
				window: { ...report.page.window, document: { width: 1280, height: 61_766 } },
				full_page: { top: 21_808, height: 16_384 }
			}
		};
		const body = build_issue_body({ report: long_page, triage, screenshots: stored, reporter });
		expect(body).toContain('<summary>Full page, rows 21,808–38,192 of 61,766 (screen dashed');
	});

	it('only links admin-only screenshots, which GitHub can’t show', () => {
		const admin_only: IssueScreenshots = {
			...stored,
			selection: { status: 'stored', url: url('selection'), is_admin_only: true }
		};
		const body = build_issue_body({ report, triage, screenshots: admin_only, reporter });
		expect(body).toContain(`[Selection](${url('selection')})`);
		expect(body).not.toContain(`![Selection]`);
		expect(body).toContain('Admins only');
	});

	it('says why a screenshot is missing', () => {
		const body = build_issue_body({
			report,
			triage,
			screenshots: { ...none, screen: { status: 'failed', reason: 'R2 said no' } },
			reporter
		});
		expect(body).toContain('The screen screenshot couldn’t be stored: R2 said no');
		expect(build_issue_body({ report, triage, screenshots: none, reporter })).toContain(
			'The browser couldn’t draw any screenshots.'
		);
	});
});
