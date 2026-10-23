import { content } from './content.server';

export async function GET() {
	const data = await content();
	return Response.json(
		{
			blocks: data
		},
		{
			headers: {
				'cache-control': `public, s-maxage=${60 * 60 * 5}`
			}
		}
	);
}
