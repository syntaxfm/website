// Filing an issue report: Claude triages it while the screenshots are stored, then it becomes an
// issue in the website's GitHub repository.
import { error } from '@sveltejs/kit';
import { GITHUB_ISSUES_TOKEN } from '$app/env/private';
import type {
	FiledIssue,
	IssueReport,
	Screenshot
} from '#lib/issue_reports/issue_report_schema.ts';
import { assert_admin_actor, type AuthenticatedUser } from '$server/auth/authorization';
import { create_github_issue } from './github_issues';
import {
	build_issue_body,
	issue_labels,
	type IssueScreenshot,
	type IssueScreenshots
} from './issue_body';
import {
	is_admin_screenshot_key,
	new_screenshot_key,
	screenshot_visibility,
	store_screenshot
} from './screenshots';
import { triage_issue_report } from './triage';

// A report still becomes an issue when a screenshot can't be stored; the issue says why
async function store_report_screenshot(
	screenshot: Screenshot | null,
	page_url: string
): Promise<IssueScreenshot> {
	if (!screenshot) return { status: 'none' };
	const { media_type, base64 } = screenshot;
	const key = new_screenshot_key(screenshot_visibility(page_url), media_type);
	try {
		const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
		const url = await store_screenshot(key, bytes, media_type);
		return { status: 'stored', url, is_admin_only: is_admin_screenshot_key(key) };
	} catch (store_error) {
		console.error('Could not store an issue report screenshot', store_error);
		return {
			status: 'failed',
			reason: store_error instanceof Error ? store_error.message : String(store_error)
		};
	}
}

async function store_report_screenshots(report: IssueReport): Promise<IssueScreenshots> {
	const { selection, screen, page } = report.screenshots;
	const [stored_selection, stored_screen, stored_page] = await Promise.all(
		[selection, screen, page].map((screenshot) =>
			store_report_screenshot(screenshot, report.page.url)
		)
	);
	return { selection: stored_selection, screen: stored_screen, page: stored_page };
}

export async function file_issue_report(
	reporter: AuthenticatedUser,
	report: IssueReport
): Promise<FiledIssue> {
	assert_admin_actor(reporter);
	// Checked first, so a report that can't be filed doesn't pay for a triage
	if (!GITHUB_ISSUES_TOKEN) error(503, 'Issues can’t be filed: GITHUB_ISSUES_TOKEN is not set');

	const [triage, screenshots] = await Promise.all([
		triage_issue_report(report),
		store_report_screenshots(report)
	]);
	const issue = await create_github_issue(GITHUB_ISSUES_TOKEN, {
		title: triage.title,
		body: build_issue_body({
			report,
			triage,
			screenshots,
			reporter: { name: reporter.name, roles: reporter.roles }
		}),
		labels: issue_labels(triage)
	});
	return { number: issue.number, url: issue.html_url, title: triage.title };
}
