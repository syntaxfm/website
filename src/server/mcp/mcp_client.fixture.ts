// An in-memory MCP client for tests: it sends MCP 2026-07-28 JSON-RPC requests as Requests straight
// to the endpoint's handler, with the request metadata (`_meta`) and the MCP-Protocol-Version,
// Mcp-Method and Mcp-Name headers that version requires, as @modelcontextprotocol/client 2.x sends
// them once it has negotiated 2026-07-28. It reads a JSON or an event-stream answer.

const PROTOCOL_VERSION = '2026-07-28';

interface JsonRpcAnswer {
	result?: unknown;
	error?: { code: number; message: string };
}

interface ToolCallResult {
	isError?: boolean;
	content: { type: string; text: string }[];
	structuredContent?: unknown;
}

function is_record(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function read_last_event_stream_message(event_stream_text: string) {
	const data_lines = event_stream_text
		.split('\n')
		.filter((line) => line.startsWith('data: '))
		.map((line) => line.slice('data: '.length));
	return data_lines.at(-1) ?? '';
}

function to_json_rpc_answer(text: string): JsonRpcAnswer | undefined {
	const parsed: unknown = JSON.parse(text);
	if (!is_record(parsed)) return undefined;
	const answer: JsonRpcAnswer = {};
	if ('result' in parsed) answer.result = parsed.result;
	if (is_record(parsed.error)) {
		answer.error = { code: Number(parsed.error.code), message: String(parsed.error.message) };
	}
	return answer;
}

function to_tool_call_result(result: unknown): ToolCallResult {
	if (!is_record(result) || !Array.isArray(result.content)) {
		throw new TypeError(`Not a tools/call result: ${JSON.stringify(result)}`);
	}
	const [first] = result.content;
	if (!is_record(first) || typeof first.text !== 'string') {
		throw new TypeError(`A tools/call result without text: ${JSON.stringify(result)}`);
	}
	return {
		isError: result.isError === true,
		content: [{ type: String(first.type), text: first.text }],
		structuredContent: result.structuredContent
	};
}

/** A client of answer_request, the endpoint's request handler. */
export function open_mcp_client(
	answer_request: (request: Request) => Promise<Response>,
	{
		endpoint_url = 'https://beta.syntax.fm/mcp',
		headers = {}
	}: { endpoint_url?: string; headers?: Record<string, string> } = {}
) {
	let next_request_id = 1;

	async function send_request(
		method: string,
		params: Record<string, unknown>,
		routing_name?: string
	) {
		const request_id = next_request_id;
		next_request_id += 1;

		const response = await answer_request(
			new Request(endpoint_url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json, text/event-stream',
					'MCP-Protocol-Version': PROTOCOL_VERSION,
					'Mcp-Method': method,
					...(routing_name === undefined ? {} : { 'Mcp-Name': routing_name }),
					...headers
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: request_id,
					method,
					params: {
						...params,
						_meta: {
							'io.modelcontextprotocol/protocolVersion': PROTOCOL_VERSION,
							'io.modelcontextprotocol/clientCapabilities': {},
							'io.modelcontextprotocol/clientInfo': { name: 'syntax-test-client', version: '1.0.0' }
						}
					}
				})
			})
		);

		const response_text = await response.text();
		const answer_text = response.headers.get('content-type')?.startsWith('text/event-stream')
			? read_last_event_stream_message(response_text)
			: response_text;
		const json_rpc_answer =
			response.ok && answer_text !== '' ? to_json_rpc_answer(answer_text) : undefined;

		return { response, response_text, json_rpc_answer };
	}

	async function list_tools() {
		const { json_rpc_answer } = await send_request('tools/list', {});
		const result = json_rpc_answer?.result;
		if (!is_record(result) || !Array.isArray(result.tools)) {
			throw new TypeError(`Not a tools/list result: ${JSON.stringify(json_rpc_answer)}`);
		}
		return result.tools.filter(is_record);
	}

	async function call_tool(tool_name: string, tool_arguments: Record<string, unknown>) {
		const { json_rpc_answer } = await send_request(
			'tools/call',
			{ name: tool_name, arguments: tool_arguments },
			tool_name
		);
		const tool_result = to_tool_call_result(json_rpc_answer?.result);
		return {
			is_error: tool_result.isError ?? false,
			result: tool_result.structuredContent,
			text: tool_result.content[0]?.text ?? ''
		};
	}

	return { send_request, list_tools, call_tool };
}
