import { content } from './content.server';

export async function GET() {
	const data = await content();
	return Response.json({
		data
	});
}
