import { get_mcp_resource_metadata } from '$server/mcp/mcp_resource_metadata';
import type { RequestHandler } from './$types';

// The MCP endpoint's Protected Resource Metadata (RFC 9728), public like the 401 that points to it:
// it names only this site's /mcp URL and Syntax Auth. The origin is the one the client requested.
export const GET: RequestHandler = ({ request }) =>
	Response.json(get_mcp_resource_metadata(new URL(request.url).origin), {
		headers: { 'Cache-Control': 'no-store' }
	});
