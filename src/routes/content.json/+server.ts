import { content } from './content.server.js';
import { json } from '@sveltejs/kit';

export const prerender = true;

export async function GET() {
	const data = await content();
	return json({
		blocks: data
	});
}
