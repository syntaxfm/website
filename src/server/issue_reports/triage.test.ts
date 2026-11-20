import { describe, expect, it, vi } from 'vitest';
import type { IssueReport } from '#lib/issue_reports/issue_report_schema.ts';

vi.mock('$app/env/private', () => ({ OPENROUTER_API_KEY: 'test-key' }));

const { build_triage_request } = await import('./triage');

const report: IssueReport = {
	request: 'The logo is cut off',
	screenshot: { media_type: 'image/png', base64: 'iVBORw0KGgo=' },
	page: {
		url: 'https://beta.syntax.fm/',
		route_id: '/(site)',
		title: 'Syntax',
		captured_at: '2026-11-20T18:00:00.000Z',
		viewport: { width: 390, height: 844, device_pixel_ratio: 3 },
		scroll: { x: 0, y: 0 },
		selection: null,
		browser: {
			user_agent: 'Mozilla/5.0',
			brand: null,
			platform: null,
			is_mobile: null,
			language: 'en-US',
			time_zone: 'America/Denver'
		},
		color_scheme: 'light',
		theme: null,
		reduced_motion: false,
		elements: [],
		errors: []
	}
};

describe('build_triage_request', () => {
	it('asks Opus 5.5 at medium effort for the issue as strict JSON', () => {
		const request = build_triage_request(report);
		expect(request.model).toBe('anthropic/claude-opus-5.5');
		expect(request.reasoning).toEqual({ effort: 'medium' });
		expect(request.response_format.json_schema.strict).toBe(true);
		expect(request.response_format.json_schema.schema.required).toEqual(
			Object.keys(request.response_format.json_schema.schema.properties)
		);
	});

	it('sends the screenshot as an image, then the request and page facts', () => {
		const [, user] = build_triage_request(report).messages;
		expect(user.content).toEqual([
			{ type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgo=' } },
			{ type: 'text', text: expect.stringContaining('<request>\nThe logo is cut off\n</request>') }
		]);
	});

	it('says so when there is no screenshot', () => {
		const [, user] = build_triage_request({ ...report, screenshot: null }).messages;
		expect(user.content).toEqual([
			{ type: 'text', text: expect.stringContaining('There is no screenshot') }
		]);
	});
});
