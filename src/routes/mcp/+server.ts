import { answer_mcp_request } from '$server/mcp/mcp_endpoint';
import { MCP_TOOLS } from '$server/mcp/mcp_tools';
import type { RequestHandler } from './$types';

// The MCP endpoint for agents such as Tasty (src/server/mcp). Every method goes to it; Effect's
// McpServer answers POST and refuses the others with 405. The endpoint checks the agent's bearer
// token itself; no cookie is read.
export const fallback: RequestHandler = ({ request }) => answer_mcp_request(request, MCP_TOOLS);
