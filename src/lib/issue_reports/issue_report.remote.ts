import { command, getRequestEvent } from '$app/server';
import { assert_admin } from '$server/auth/request_auth';
import { file_issue_report } from '$server/issue_reports/file_issue_report';
import { take_page_screenshots } from '$server/issue_reports/page_screenshots';
import { issue_report_page_schema, issue_report_schema } from './issue_report_schema';

// Both are called from any page (the Report button sits in the admin menu), so they check for an
// admin themselves

export const take_screenshots = command(issue_report_page_schema, async (page) => {
	await assert_admin();
	const { url, request } = getRequestEvent();
	return take_page_screenshots(page, {
		site_host: url.host,
		cookie_header: request.headers.get('cookie')
	});
});

export const file_report = command(issue_report_schema, async (report) =>
	file_issue_report(await assert_admin(), report)
);
