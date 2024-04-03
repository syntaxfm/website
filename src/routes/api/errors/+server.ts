import type { RequestHandler } from '@sveltejs/kit';

const SENTRY_HOST = 'o4505358925561856.ingest.sentry.io';
const SENTRY_PROJECT_IDS = ['4505358945419264'];

export const POST: RequestHandler = async ({ request }) => {
	try {
		const envelope = await request.text();
		const piece = envelope.split('\n')[0];
		const header = JSON.parse(piece);
		const dsn = new URL(header['dsn']);
		const project_id = dsn.pathname?.replace('/', '');

		if (dsn.hostname !== SENTRY_HOST) {
			throw new Error(`Invalid sentry hostname: ${dsn.hostname}`);
		}

		if (!project_id || !SENTRY_PROJECT_IDS.includes(project_id)) {
			throw new Error(`Invalid sentry project id: ${project_id}`);
		}

		const upstream_sentry_url = `https://${SENTRY_HOST}/api/${project_id}/envelope/`;
		await fetch(upstream_sentry_url, { method: 'POST', body: envelope });

		return Response.json({}, { status: 200 });
	} catch (e) {
		console.error('error tunneling to sentry', e);
		return Response.json({ error: 'error tunneling to sentry' }, { status: 500 });
	}
};
