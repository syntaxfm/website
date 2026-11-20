import { describe, expect, it, vi } from 'vitest';
import { SAMPLE_REPORT } from '#lib/issue_reports/issue_report.fixture.ts';

vi.mock('$app/env/private', () => ({ OPENROUTER_API_KEY: 'test-key' }));

const { build_triage_request } = await import('./triage');

describe('build_triage_request', () => {
	it('asks Opus 5.5 at medium effort for the issue as strict JSON', () => {
		const request = build_triage_request(SAMPLE_REPORT);
		expect(request.model).toBe('anthropic/claude-opus-5.5');
		expect(request.reasoning).toEqual({ effort: 'medium' });
		expect(request.response_format.json_schema.strict).toBe(true);
		expect(request.response_format.json_schema.schema.required).toEqual(
			Object.keys(request.response_format.json_schema.schema.properties)
		);
		// So the issue can say what the triage cost
		expect(request.usage).toEqual({ include: true });
	});

	it('sends the selection and the screen, named, then the request and page facts', () => {
		const [, user] = build_triage_request(SAMPLE_REPORT).messages;
		expect(user.content).toEqual([
			{ type: 'text', text: 'The selected area:' },
			{ type: 'image_url', image_url: { url: 'data:image/png;base64,c2VsZWN0aW9u' } },
			{ type: 'text', text: 'The whole screen:' },
			{ type: 'image_url', image_url: { url: 'data:image/png;base64,c2NyZWVu' } },
			{
				type: 'text',
				text: expect.stringContaining('<request>\nThis title is busted on my phone')
			}
		]);
	});

	it('leaves the tall full page out', () => {
		const [, user] = build_triage_request(SAMPLE_REPORT).messages;
		expect(JSON.stringify(user.content)).not.toContain('cGFnZQ==');
	});

	it('says so when the browser drew nothing', () => {
		const report = {
			...SAMPLE_REPORT,
			screenshots: { selection: null, screen: null, page: null }
		};
		const [, user] = build_triage_request(report).messages;
		expect(user.content).toEqual([
			{ type: 'text', text: expect.stringContaining('There are no screenshots') }
		]);
	});
});
