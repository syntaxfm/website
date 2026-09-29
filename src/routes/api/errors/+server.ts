import type { RequestHandler } from '@sveltejs/kit';
import optionsHandler from '../optionsHandler';

const SENTRY_HOST = 'o4505358925561856.ingest.sentry.io';
const SENTRY_PROJECT_IDS = ['4505358945419264'];
const NEWLINE = 0x0a;

export const OPTIONS = optionsHandler();

export const POST: RequestHandler = async ({ request }) => {
	let envelope = new Uint8Array();
	try {
		// Replay items are compressed binary, so keep the raw bytes and only decode the header line.
		envelope = new Uint8Array(await request.arrayBuffer());
		const header_end = envelope.indexOf(NEWLINE);
		const header = JSON.parse(
			new TextDecoder().decode(header_end === -1 ? envelope : envelope.subarray(0, header_end))
		);
		const dsn = new URL(header['dsn']);
		const project_id = dsn.pathname?.replace('/', '');

		if (dsn.hostname !== SENTRY_HOST) {
			throw new Error(`Invalid sentry hostname: ${dsn.hostname}`);
		}

		if (!project_id || !SENTRY_PROJECT_IDS.includes(project_id)) {
			throw new Error(`Invalid sentry project id: ${project_id}`);
		}

		const upstream_sentry_url = `https://${SENTRY_HOST}/api/${project_id}/envelope/`;
		await fetch(upstream_sentry_url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-sentry-envelope' },
			body: envelope
		});

		return Response.json({}, { status: 200 });
	} catch (e) {
		console.error('error tunneling to sentry', e, `(${envelope.byteLength} bytes)`);
		let message: string | undefined = undefined;
		if (e instanceof Error) {
			message = e.message;
		}
		return Response.json({ error: 'error tunneling to sentry', message }, { status: 500 });
	}
};
