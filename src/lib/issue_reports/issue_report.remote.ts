import { command } from '$app/server';
import { assert_admin } from '$server/auth/request_auth';
import { file_issue_report } from '$server/issue_reports/file_issue_report';
import { issue_report_schema } from './issue_report_schema';

// Called from any page (the Report button sits in the admin menu), so it checks for an admin itself
export const file_report = command(issue_report_schema, async (report) =>
	file_issue_report(await assert_admin(), report)
);
