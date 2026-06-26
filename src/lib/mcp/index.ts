import { McpServer } from 'tmcp';
import { ZodV3JsonSchemaAdapter } from '@tmcp/adapter-zod-v3';
import { icons } from './icons/index.js';
import { HttpTransport } from '@tmcp/transport-http';
import { setup_tools } from './tools';
import { setup_resources } from './resources';

export type SyntaxMCP = typeof server;

const server = new McpServer(
	{
		description: 'MCP server to access Syntax episodes and transcripts',
		name: 'Syntax MCP Server',
		websiteUrl: 'https://syntax.fm',
		version: '0.1.0',
		icons
	},
	{
		adapter: new ZodV3JsonSchemaAdapter(),
		capabilities: {
			tools: {},
			resources: {},
			completions: {}
		}
	}
);

setup_tools(server);
setup_resources(server);

export const transport = new HttpTransport(server, {
	cors: true,
	path: '/mcp'
});
