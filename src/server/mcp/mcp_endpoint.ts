import * as Cause from 'effect/Cause';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import * as McpProtocol from 'effect/ai/McpProtocol';
import * as McpSchema from 'effect/ai/McpSchema';
import * as McpServer from 'effect/ai/McpServer';
import * as HttpRouter from 'effect/http/HttpRouter';

import { get_profile_authorization, type Actor } from '$server/auth/authorization';

import { check_mcp_access_token, type KeySetFetch } from './mcp_access_token';
import { MCP_PATHNAME } from './mcp_route';
import type { McpTool, McpToolAnswer } from './mcp_tools';

// The MCP endpoint (src/routes/mcp/+server.ts), on beta.syntax.fm and under `pnpm dev`, where local
// Syntax Auth issues the token. The agent signs in with a Syntax Auth access token for this site's
// /mcp URL (mcp_access_token.ts); every request then reads that User's Profile roles, so a removed
// admin loses admin tools on their next call. Each tool checks the role again (mcp_tools.ts).
//
// It serves Effect's McpServer on MCP 2026-07-28 only, the one request-stateless version, so no
// session lives in a Worker isolate; Syntax Lab's endpoint does the same and its client checks are
// in syntax-lab docs/tech/agent-access.md ("MCP protocol versions"). The server is built for each
// request, because the actor arrives per request.

const MCP_PROTOCOLS = [McpProtocol.v2026_07_28] as const;

const SERVER_INSTRUCTIONS =
	"Syntax.fm's Shows, videos, articles, guests and tags, run as the signed-in person. Anyone signed in can read what the site has released. Tools whose description starts with 'Admin only' need the admin role; they also see drafts and scheduled content.";

// The build's version for MCP's serverInfo. Vite defines APP_VERSION from npm's package version,
// which is unset when Vite runs outside a package script (vitest through pnpm exec).
const SERVER_VERSION = APP_VERSION || 'unknown-build';

const decode_tool_json = Schema.decodeUnknownSync(McpSchema.ToolJson);

function to_tool_result({ is_error, result }: McpToolAnswer) {
	return new McpSchema.CallToolResult({
		isError: is_error,
		content: [{ type: 'text', text: JSON.stringify(result) }],
		structuredContent: result
	});
}

// A tool's answer threw something other than kit's error: a bug, logged with its cause
class McpToolFailedError extends Error {}

// Registers one tool for this request's actor. Anything a tool throws is logged and answered with
// MCP's internal error, whose message says nothing about the cause.
function add_tool(tool: McpTool, actor: Actor) {
	return McpServer.McpServer.use((mcp_server) =>
		mcp_server.addTool({
			tool: new McpSchema.Tool({
				name: tool.name,
				description: tool.description,
				inputSchema: decode_tool_json(tool.input_schema),
				annotations: {
					readOnlyHint: tool.is_read_only,
					destructiveHint: false,
					idempotentHint: tool.is_idempotent,
					openWorldHint: false
				}
			}),
			annotations: Context.empty(),
			handle: (tool_arguments) =>
				Effect.tryPromise({
					try: () => tool.call(actor, tool_arguments),
					catch: (cause) => new McpToolFailedError('MCP tool failed', { cause })
				}).pipe(
					Effect.map(to_tool_result),
					Effect.catchCause((tool_failure) =>
						Effect.sync(() => {
							console.error(`MCP tool ${tool.name} failed`, Cause.pretty(tool_failure));
						}).pipe(
							Effect.andThen(
								Effect.fail(
									new McpSchema.InternalError({ message: "Syntax couldn't finish this request." })
								)
							)
						)
					)
				)
		})
	);
}

/**
 * Answers one MCP request for actor with a server built for it. No allowedOrigins, so any request
 * with a browser Origin gets 403. The body is read in full before the server is disposed, so
 * disposal can't cut an event stream short.
 */
export async function answer_mcp_for_actor(
	request: Request,
	actor: Actor,
	tools: readonly McpTool[]
): Promise<Response> {
	const server_layer = Layer.effectDiscard(
		Effect.forEach(tools, (tool) => add_tool(tool, actor), { discard: true })
	).pipe(
		Layer.provideMerge(
			McpServer.layerHttp({
				name: 'syntax-website',
				version: SERVER_VERSION,
				instructions: SERVER_INSTRUCTIONS,
				path: MCP_PATHNAME,
				protocols: MCP_PROTOCOLS
			})
		)
	);

	const { handler, dispose } = HttpRouter.toWebHandler(server_layer, { disableLogger: true });

	try {
		const mcp_response = await handler(request);
		const body = await mcp_response.arrayBuffer();
		const headers = new Headers(mcp_response.headers);
		headers.set('Cache-Control', 'no-store');

		return new Response(mcp_response.status === 204 ? null : body, {
			status: mcp_response.status,
			statusText: mcp_response.statusText,
			headers
		});
	} finally {
		await dispose();
	}
}

/**
 * Answers one request to /mcp: 401 or 503 from the token check, else the MCP answer for the User
 * the token stands for. key_set_fetch is for tests; the app uses the platform's fetch.
 */
export async function answer_mcp_request(
	request: Request,
	tools: readonly McpTool[],
	key_set_fetch?: KeySetFetch
): Promise<Response> {
	const token_check = await check_mcp_access_token(request, key_set_fetch);
	if (!token_check.is_signed_in) return token_check.response;

	const central_user_id = token_check.claims.sub;
	const actor: Actor = {
		id: central_user_id,
		...(await get_profile_authorization(central_user_id))
	};

	return answer_mcp_for_actor(request, actor, tools);
}
