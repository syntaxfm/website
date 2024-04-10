import type { RequestHandler } from '@sveltejs/kit';

const optionsHandler = (methods: string = 'OPTIONS,POST') => {
	const options: RequestHandler = async ({ request }) => {
		return new Response(null, {
			headers: {
				'Access-Control-Allow-Credentials': 'true',
				'Access-Control-Allow-Origin': request.headers.get('origin') || 'syntax.fm',
				'Access-Control-Allow-Methods': methods,
				'Access-Control-Allow-Headers':
					'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
			}
		});
	};
	return options;
};

export default optionsHandler;
