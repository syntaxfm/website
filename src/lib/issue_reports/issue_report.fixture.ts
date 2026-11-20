// A report from an iPhone, for tests
import type { IssueReport } from './issue_report_schema';

export const SAMPLE_REPORT: IssueReport = {
	request: 'This title is busted on my phone\nfix it pls',
	screenshots: {
		selection: { media_type: 'image/png', base64: 'c2VsZWN0aW9u' },
		screen: { media_type: 'image/png', base64: 'c2NyZWVu' },
		page: { media_type: 'image/jpeg', base64: 'cGFnZQ==' }
	},
	page: {
		url: 'https://beta.syntax.fm/show/900/some-episode',
		route_id: '/(site)/show/[show_number]/[slug]',
		title: 'Some Episode - Syntax',
		captured_at: '2026-11-20T18:00:00.000Z',
		window: {
			viewport: { width: 390, height: 664 },
			visual_viewport: { width: 390, height: 664, scale: 1 },
			outer: { width: 390, height: 844 },
			screen: { width: 390, height: 844, orientation: 'portrait-primary' },
			document: { width: 390, height: 9120 },
			device_pixel_ratio: 3
		},
		scroll: { x: 0, y: 1200 },
		full_page: { top: 0, height: 9120 },
		selection: { x: 10, y: 20, width: 300, height: 120.4 },
		anchor: { path: 'body > div > main > section > h1', text: 'Some Episode', x: 16, y: 40 },
		browser: {
			name: 'Safari 18.2 on iOS 18.2',
			user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X)',
			is_mobile: true,
			is_touch: true,
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
