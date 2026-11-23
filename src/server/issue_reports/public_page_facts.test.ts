import { describe, expect, it } from 'vitest';
import { SAMPLE_REPORT } from '#lib/issue_reports/issue_report.fixture.ts';
import { is_admin_page, public_page_facts } from './public_page_facts';

const page = SAMPLE_REPORT.page;
const admin_page = {
	...page,
	url: 'https://beta.syntax.fm/admin/users',
	anchor: { path: 'table > tr > td', text: 'jane@example.com', x: 16, y: 40 },
	elements: [
		{ kind: 'element' as const, selector: 'td.email', text: 'jane@example.com', source: null }
	]
};

describe('public_page_facts', () => {
	it('keeps the browser’s name but not its user agent', () => {
		expect(public_page_facts(page).browser).toEqual({
			name: 'Safari 18.2 on iOS 18.2',
			is_mobile: true,
			is_touch: true
		});
	});

	it('keeps the selected text on public pages', () => {
		expect(public_page_facts(page).elements).toEqual(page.elements);
		expect(public_page_facts(page).anchor).toEqual(page.anchor);
	});

	it('leaves out the selected text on admin pages, where it can be listeners’ data', () => {
		const facts = public_page_facts(admin_page);
		expect(JSON.stringify(facts)).not.toContain('jane@example.com');
		expect(facts.elements[0].selector).toBe('td.email');
		expect(facts.anchor?.path).toBe('table > tr > td');
	});
});

describe('is_admin_page', () => {
	it('is /admin and the pages under it', () => {
		expect(is_admin_page('https://beta.syntax.fm/admin')).toBe(true);
		expect(is_admin_page('https://beta.syntax.fm/admin/submissions')).toBe(true);
		expect(is_admin_page('https://beta.syntax.fm/administrivia')).toBe(false);
		expect(is_admin_page('https://beta.syntax.fm/show/900/x')).toBe(false);
	});
});
