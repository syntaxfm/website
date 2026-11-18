import type { RequestEvent } from '@sveltejs/kit';

// The MCP endpoint's two paths. An agent has no Syntax cookie: it signs in with a bearer token,
// which the endpoint checks itself (mcp_access_token.ts). So these two requests, and only these,
// skip the cookie sign-in and the page cache (src/hooks.server.ts).

/** Where the MCP endpoint answers (src/routes/mcp/+server.ts). */
export const MCP_PATHNAME = '/mcp';

/**
 * Where MCP clients look for the endpoint's Protected Resource Metadata (RFC 9728): the well-known
 * prefix goes before the resource's path, so it can't sit under /mcp.
 */
export const MCP_RESOURCE_METADATA_PATHNAME = '/.well-known/oauth-protected-resource/mcp';

// Kit runs a remote form on any page POST whose search has this parameter, without marking the
// request as remote.
const KIT_REMOTE_FORM_SEARCH_PARAM = '/remote';

/**
 * Whether the request is for one of the two MCP paths, exactly. The path comes from the URL the
 * client requested: on a remote call kit sets `event.url` from client headers, so `event.url` can
 * claim /mcp. Remote calls, data requests, and remote form posts never match.
 */
export function is_mcp_request(
	event: Pick<RequestEvent, 'isDataRequest' | 'isRemoteRequest' | 'request'>
): boolean {
	const request_url = new URL(event.request.url);

	return (
		!event.isRemoteRequest &&
		!event.isDataRequest &&
		!request_url.searchParams.has(KIT_REMOTE_FORM_SEARCH_PARAM) &&
		(request_url.pathname === MCP_PATHNAME ||
			request_url.pathname === MCP_RESOURCE_METADATA_PATHNAME)
	);
}
