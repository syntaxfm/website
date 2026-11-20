import { describe, expect, it } from 'vitest';
import type { IssueReport } from '#lib/issue_reports/issue_report_schema.ts';
import {
	NEEDS_INFO_LABEL,
	SITE_REPORT_LABEL,
	build_issue_body,
	issue_labels,
	route_directory
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

const report: IssueReport = {
	request: 'This title is busted on my phone\nfix it pls',
	screenshot: null,
	page: {
		url: 'https://beta.syntax.fm/show/900/some-episode',
		route_id: '/(site)/show/[show_number]/[slug]',
		title: 'Some Episode - Syntax',
		captured_at: '2026-11-20T18:00:00.000Z',
		viewport: { width: 390, height: 844, device_pixel_ratio: 3 },
		scroll: { x: 0, y: 1200 },
		selection: { x: 10, y: 20, width: 300, height: 120.4 },
		browser: {
			user_agent: 'Mozilla/5.0',
			brand: 'Google Chrome 142',
			platform: 'macOS',
			is_mobile: false,
			language: 'en-US',
			time_zone: 'America/Denver'
		},
		color_scheme: 'dark',
		theme: 'theme-system',
		reduced_motion: false,
		elements: [
			{ kind: 'area', selector: 'main > section.hero', text: '', source: null },
			{
				kind: 'element',
				selector: 'section.hero > h1.title',
				text: 'Some Episode',
				source: 'src/routes/(site)/show/[show_number]/[slug]/+page.svelte:12:2'
			}
		],
		errors: [{ message: 'TypeError: x is undefined', source: null, at: '2026-11-20T17:59:00.000Z' }]
	}
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
		const body = build_issue_body({
			report,
			triage,
			screenshot: { status: 'none' },
			reporter_name: 'Scott Tolinski'
		});
		expect(body.startsWith(triage.summary)).toBe(true);
		expect(body).toContain('- [ ] At 390px wide the title wraps inside the card');
		expect(body).toContain(
			'### Request from Scott Tolinski\n\n> This title is busted on my phone\n> fix it pls'
		);
		expect(body).not.toContain('### Open questions');
	});

	it('says where the selection is and which code made it', () => {
		const body = build_issue_body({
			report,
			triage,
			screenshot: { status: 'none' },
			reporter_name: 'Scott'
		});
		expect(body).toContain('in `src/routes/(site)/show/[show_number]/[slug]/`');
		expect(body).toContain('300×120 at (10, 20) in the viewport, (10, 1220) on the page');
		expect(body).toContain('area `main > section.hero`');
		expect(body).toContain(
			'`section.hero > h1.title` “Some Episode” — `src/routes/(site)/show/[show_number]/[slug]/+page.svelte:12:2`'
		);
		expect(body).toContain('`TypeError: x is undefined`');
		expect(body).toContain('Google Chrome 142 on macOS · 390×844 viewport at 3x · dark mode');
		expect(body).toContain('"route_id": "/(site)/show/[show_number]/[slug]"');
	});

	it('shows a public screenshot and only links an admin one', () => {
		const url = 'https://beta.syntax.fm/issue-screenshots/public/2026-11/a.png';
		const shown = build_issue_body({
			report,
			triage,
			screenshot: { status: 'stored', url, is_admin_only: false },
			reporter_name: 'Scott'
		});
		expect(shown).toContain(`![Selected area](${url})`);

		const linked = build_issue_body({
			report,
			triage,
			screenshot: { status: 'stored', url, is_admin_only: true },
			reporter_name: 'Scott'
		});
		expect(linked).not.toContain('![');
		expect(linked).toContain(`[Screenshot](${url}) (admins only`);
	});

	it('says why there is no screenshot', () => {
		const body = build_issue_body({
			report,
			triage,
			screenshot: { status: 'failed', reason: 'R2 said no' },
			reporter_name: 'Scott'
		});
		expect(body).toContain('The screenshot couldn’t be stored: R2 said no');
	});
});
