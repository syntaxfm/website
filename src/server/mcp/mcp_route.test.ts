import { describe, expect, it } from 'vitest';

import { is_mcp_request } from './mcp_route';

function event_for(url: string, { is_remote = false, is_data = false } = {}) {
	return { request: new Request(url), isRemoteRequest: is_remote, isDataRequest: is_data };
}

describe('is_mcp_request', () => {
	it('matches the endpoint and its protected resource metadata, exactly', () => {
		expect(is_mcp_request(event_for('https://beta.syntax.fm/mcp'))).toBe(true);
		expect(
			is_mcp_request(event_for('https://beta.syntax.fm/.well-known/oauth-protected-resource/mcp'))
		).toBe(true);
		expect(is_mcp_request(event_for('https://beta.syntax.fm/mcp/tools'))).toBe(false);
		expect(is_mcp_request(event_for('https://beta.syntax.fm/admin'))).toBe(false);
	});

	it('leaves remote calls, data requests and remote form posts to the other hooks, even at /mcp', () => {
		expect(is_mcp_request(event_for('https://beta.syntax.fm/mcp', { is_remote: true }))).toBe(
			false
		);
		expect(is_mcp_request(event_for('https://beta.syntax.fm/mcp', { is_data: true }))).toBe(false);
		expect(is_mcp_request(event_for('https://beta.syntax.fm/mcp?/remote=abc'))).toBe(false);
	});
});
