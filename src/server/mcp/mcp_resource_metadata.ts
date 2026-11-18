import { SYNTAX_AUTH_ISSUER } from '$server/auth/syntax_auth';

import { MCP_SCOPES } from './mcp_access_token';
import { MCP_PATHNAME } from './mcp_route';

/**
 * The MCP endpoint's Protected Resource Metadata (RFC 9728), which MCP clients read to find where
 * to sign in: the resource is this site's own /mcp URL (the token audience the endpoint requires),
 * and the one authorization server is Syntax Auth (https://auth.syntax.fm/api/auth in production).
 * Tokens go only in the Authorization header.
 */
export function get_mcp_resource_metadata(app_origin: string) {
	return {
		resource: `${app_origin}${MCP_PATHNAME}`,
		authorization_servers: [SYNTAX_AUTH_ISSUER],
		scopes_supported: MCP_SCOPES,
		bearer_methods_supported: ['header'],
		resource_name: 'Syntax'
	};
}
