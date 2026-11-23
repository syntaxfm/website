import { command } from '$app/server';
import { assert_admin } from '$server/auth/request_auth';
import { file_issue_report } from '$server/issue_reports/file_issue_report';
import {
	open_reported_page,
	shoot_full_page,
	shoot_screen
} from '$server/issue_reports/page_screenshots';
import {
	issue_report_page_schema,
	issue_report_schema,
	page_shot_schema
} from './issue_report_schema';

// All are called from any page (the Report button sits in the admin menu), so they check for an
// admin themselves

// Report opens the page in the headless browser while the admin selects
export const open_report_page = command(issue_report_page_schema, async (page) => {
	await assert_admin();
	return open_reported_page(page);
});

export const take_screen_screenshot = command(page_shot_schema, async ({ kept_page, page }) => {
	await assert_admin();
	return shoot_screen(kept_page, page);
});

export const take_full_page_screenshot = command(page_shot_schema, async ({ kept_page, page }) => {
	await assert_admin();
	return shoot_full_page(kept_page, page);
});

export const file_report = command(issue_report_schema, async (report) =>
	file_issue_report(await assert_admin(), report)
);
