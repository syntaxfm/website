import { error } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	access_token_claims_fixture,
	key_set_fetch_fixture,
	open_signing_key_fixture
} from './mcp_access_token.fixture';
import { open_mcp_client } from './mcp_client.fixture';

// The endpoint end to end: a signed token, the Profile's roles from the database, Effect's MCP
// server on 2026-07-28, and the real tool definitions. The server functions behind the tools are
// stand-ins, so each test sees exactly which actor and input reached them.

const { find_profile, server_functions } = vi.hoisted(() => ({
	find_profile: vi.fn(),
	server_functions: {
		list_tags: vi.fn(),
		get_tag_detail: vi.fn(),
		create_tag: vi.fn(),
		update_tag: vi.fn(),
		get_show: vi.fn(),
		get_seo_search: vi.fn()
	}
}));

vi.mock('$app/env', () => ({ dev: false }));
vi.mock('$app/env/private', () => ({ SYNTAX_AUTH_PUBLIC_ORIGINS: undefined }));
vi.mock('$server/db/client', () => ({ db: { query: { profile: { findFirst: find_profile } } } }));
vi.mock('$server/tags/tags', () => ({
	list_tags: server_functions.list_tags,
	get_tag_detail: server_functions.get_tag_detail,
	create_tag: server_functions.create_tag,
	update_tag: server_functions.update_tag
}));
vi.mock('$server/shows/show_editor', () => ({
	get_show: server_functions.get_show,
	get_show_editor: vi.fn(),
	list_shows: vi.fn(),
	create_show: vi.fn(),
	update_show: vi.fn()
}));
vi.mock('$server/admin/dashboard', () => ({ get_admin_dashboard: vi.fn() }));
vi.mock('$server/articles/articles', () => ({ create_article: vi.fn(), update_article: vi.fn() }));
vi.mock('$server/content/content', () => ({
	list_content: vi.fn(),
	get_content_detail: vi.fn(),
	bulk_update_status: vi.fn(),
	assign_content_tags: vi.fn(),
	remove_content_tags: vi.fn()
}));
vi.mock('$server/guests/guests', () => ({
	list_guests: vi.fn(),
	get_guest_detail: vi.fn(),
	create_guest: vi.fn(),
	update_guest: vi.fn()
}));
vi.mock('$server/seo_tracker/seo_queries', () => ({
	get_seo_overview: vi.fn(),
	list_seo_searches: vi.fn(),
	get_seo_search: server_functions.get_seo_search,
	search_seo_keywords: vi.fn(),
	list_seo_opportunities: vi.fn()
}));
vi.mock('$server/submissions/submissions', () => ({
	list_submissions: vi.fn(),
	bulk_update_submission_status: vi.fn()
}));
vi.mock('$server/video/videos', () => ({ list_videos: vi.fn(), update_video_meta: vi.fn() }));

const { answer_mcp_request } = await import('./mcp_endpoint');
const { MCP_TOOLS } = await import('./mcp_tools');

const syntax_auth_key = await open_signing_key_fixture('syntax-auth-key-1');
const { key_set_fetch } = key_set_fetch_fixture([syntax_auth_key.published_key]);

const CENTRAL_USER_ID = 'central-user-7c1d';
const TAG_ID = '3f0c1d52-4b8e-4f8e-9a51-6f0e2d3c4b5a';

async function open_client({ headers = {} }: { headers?: Record<string, string> } = {}) {
	const access_token = await syntax_auth_key.sign_access_token(
		access_token_claims_fixture(CENTRAL_USER_ID)
	);
	return open_mcp_client((request) => answer_mcp_request(request, MCP_TOOLS, key_set_fetch), {
		headers: { Authorization: `Bearer ${access_token}`, ...headers }
	});
}

function signed_in_as(roles: string[]) {
	find_profile.mockResolvedValue({
		id: 'profile-1',
		roles: roles.map((name) => ({ role: { name } }))
	});
}

describe('answer_mcp_request', () => {
	beforeEach(() => {
		find_profile.mockReset();
		for (const server_function of Object.values(server_functions)) server_function.mockReset();
	});

	it('answers a request without a token with 401 and where to sign in', async () => {
		const response = await answer_mcp_request(
			new Request('https://beta.syntax.fm/mcp', { method: 'POST', body: '{}' }),
			MCP_TOOLS,
			key_set_fetch
		);

		expect(response.status).toBe(401);
		expect(response.headers.get('WWW-Authenticate')).toContain(
			'resource_metadata="https://beta.syntax.fm/.well-known/oauth-protected-resource/mcp"'
		);
		expect(find_profile).not.toHaveBeenCalled();
	});

	it('lists every tool with a strict, described input schema', async () => {
		signed_in_as([]);
		const client = await open_client();

		const tools = await client.list_tools();

		expect(tools.map((tool) => tool.name)).toEqual(MCP_TOOLS.map((tool) => tool.name));
		for (const tool of tools) {
			expect(tool.description).toEqual(expect.any(String));
			expect(tool.inputSchema).toMatchObject({ type: 'object', additionalProperties: false });
			const properties = Object.values(
				(tool.inputSchema as { properties?: Record<string, { description?: string }> })
					.properties ?? {}
			);
			for (const property of properties) expect(property.description).toEqual(expect.any(String));
		}
	});

	it('runs a read as the signed-in person and answers with its result', async () => {
		signed_in_as([]);
		server_functions.list_tags.mockResolvedValue({
			items: [{ id: TAG_ID, name: 'CSS', slug: 'css', content_count: 3 }],
			total: 1,
			page: 1,
			page_size: 25,
			total_pages: 1
		});
		const client = await open_client();

		const answer = await client.call_tool('search_tags', { search_text: 'css' });

		expect(answer.is_error).toBe(false);
		expect(answer.result).toMatchObject({ items: [{ name: 'CSS', slug: 'css' }], total: 1 });
		expect(server_functions.list_tags).toHaveBeenCalledWith(
			{ id: CENTRAL_USER_ID, profile_id: 'profile-1', roles: [] },
			{ search_text: 'css' }
		);
	});

	it('refuses an admin tool to someone without the admin role, and runs nothing', async () => {
		signed_in_as([]);
		const client = await open_client();

		const answer = await client.call_tool('create_tag', { name: 'Rust' });

		expect(answer.is_error).toBe(true);
		expect(answer.result).toEqual({
			error: {
				status: 403,
				message:
					'Admin access required: your Syntax account doesn’t have the admin role. Nothing was changed.'
			}
		});
		expect(server_functions.create_tag).not.toHaveBeenCalled();
	});

	it('runs an admin tool for an admin, with the admin as the actor', async () => {
		signed_in_as(['admin']);
		server_functions.create_tag.mockResolvedValue({ id: TAG_ID, name: 'Rust', slug: 'rust' });
		const client = await open_client();

		const answer = await client.call_tool('create_tag', { name: 'Rust' });

		expect(answer).toMatchObject({ is_error: false, result: { id: TAG_ID, slug: 'rust' } });
		expect(server_functions.create_tag).toHaveBeenCalledWith(
			{ id: CENTRAL_USER_ID, profile_id: 'profile-1', roles: ['admin'] },
			{ name: 'Rust' }
		);
	});

	it('serves SEO data as small admin-only tools, and no whole report', async () => {
		signed_in_as([]);
		const client = await open_client();
		const tool_names = (await client.list_tools()).map((tool) => tool.name);

		expect(tool_names).toEqual(
			expect.arrayContaining([
				'get_seo_overview',
				'list_seo_searches',
				'get_seo_search',
				'search_seo_keywords',
				'list_seo_opportunities'
			])
		);
		expect(tool_names).not.toContain('get_seo_report');
		expect(
			MCP_TOOLS.filter((tool) => tool.name.includes('seo')).every(
				(tool) => tool.access === 'admin' && tool.is_read_only
			)
		).toBe(true);

		const refused = await client.call_tool('get_seo_search', { search: 'ai engineering' });
		expect(refused.result).toMatchObject({ error: { status: 403 } });
		expect(server_functions.get_seo_search).not.toHaveBeenCalled();
	});

	it('looks up one tracked search for an admin, all platforms and 8 snapshots by default', async () => {
		signed_in_as(['admin']);
		server_functions.get_seo_search.mockResolvedValue({ search: 'ai engineering' });
		const client = await open_client();

		const answer = await client.call_tool('get_seo_search', { search: 'ai engineering' });

		expect(answer).toMatchObject({ is_error: false, result: { search: 'ai engineering' } });
		expect(server_functions.get_seo_search).toHaveBeenCalledWith(
			{ id: CENTRAL_USER_ID, profile_id: 'profile-1', roles: ['admin'] },
			{ search: 'ai engineering', platform: 'all', history_limit: 8 }
		);
	});

	it('answers arguments the schema refuses with a tool error, and runs nothing', async () => {
		signed_in_as(['admin']);
		const client = await open_client();

		const answer = await client.call_tool('create_tag', { name: 'Rust', color: 'orange' });

		expect(answer.is_error).toBe(true);
		expect(answer.result).toMatchObject({ error: { status: 400 } });
		expect(answer.text).toContain('color');
		expect(server_functions.create_tag).not.toHaveBeenCalled();
	});

	it("answers a server function's refusal with its status and message", async () => {
		signed_in_as([]);
		server_functions.get_show.mockResolvedValue(null);
		const client = await open_client();

		const answer = await client.call_tool('get_show', { show_number: 999 });

		expect(answer).toMatchObject({
			is_error: true,
			result: { error: { status: 404, message: 'Show not found' } }
		});
	});

	it('passes on kit errors a server function throws', async () => {
		signed_in_as(['admin']);
		server_functions.update_tag.mockImplementation(() => error(400, 'Tag slug is invalid'));
		const client = await open_client();

		const answer = await client.call_tool('update_tag', { tag_id: TAG_ID, name: '!!!' });

		expect(answer.result).toEqual({ error: { status: 400, message: 'Tag slug is invalid' } });
	});

	it('refuses a request a web page sent, whatever its token', async () => {
		signed_in_as(['admin']);
		const client = await open_client({ headers: { Origin: 'https://evil.example' } });

		const { response } = await client.send_request('tools/list', {});

		expect(response.status).toBe(403);
	});
});
