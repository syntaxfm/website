import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/env/private', () => ({ SYNTAX_AUTH_PUBLIC_ORIGINS: undefined }));

async function load_metadata(dev: boolean) {
	vi.resetModules();
	vi.doMock('$app/env', () => ({ dev }));
	return (await import('./mcp_resource_metadata')).get_mcp_resource_metadata;
}

describe('get_mcp_resource_metadata', () => {
	it("names this site's /mcp URL as the resource and production Syntax Auth as its only authorization server", async () => {
		const get_mcp_resource_metadata = await load_metadata(false);

		expect(get_mcp_resource_metadata('https://beta.syntax.fm')).toEqual({
			resource: 'https://beta.syntax.fm/mcp',
			authorization_servers: ['https://auth.syntax.fm/api/auth'],
			scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
			bearer_methods_supported: ['header'],
			resource_name: 'Syntax'
		});
	});

	it('names local Syntax Auth in a development build', async () => {
		const get_mcp_resource_metadata = await load_metadata(true);

		expect(get_mcp_resource_metadata('http://localhost:5740')).toMatchObject({
			resource: 'http://localhost:5740/mcp',
			authorization_servers: ['http://localhost:37960/api/auth']
		});
	});
});
