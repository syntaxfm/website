import { content } from './content.server.js';
import { json } from '@sveltejs/kit';

export async function GET() {
	const data = await content();
	return json({
		blocks: data
	});
}
