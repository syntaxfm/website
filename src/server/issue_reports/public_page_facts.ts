// The page facts an issue report's GitHub issue and Claude's triage get. The repository is public,
// so nothing in them points to the admin who filed it: the user agent only goes to the headless
// browser (page_screenshots.ts). On /admin pages the text in the selected area can be listeners'
// names or emails, so there the elements keep their selectors and lose their text.
import type { IssueReportPage } from '#lib/issue_reports/issue_report_schema.ts';

export type PublicPageFacts = Omit<IssueReportPage, 'browser'> & {
	browser: Omit<IssueReportPage['browser'], 'user_agent'>;
};

export function is_admin_page(page_url: string): boolean {
	const { pathname } = new URL(page_url);
	return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function public_page_facts(page: IssueReportPage): PublicPageFacts {
	const { name, is_mobile, is_touch } = page.browser;
	const facts = { ...page, browser: { name, is_mobile, is_touch } };
	if (!is_admin_page(page.url)) return facts;
	return {
		...facts,
		anchor: page.anchor && { ...page.anchor, text: '' },
		elements: page.elements.map((element) => ({ ...element, text: '' }))
	};
}
