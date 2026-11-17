// Cloudflare runs this every 20 minutes (alchemy.run.ts). It asks the website, through a service
// binding, to transcribe the newest released episode without a transcript: one episode per run.
// It never throws, so Cloudflare never retries a run (a retry could pay Grok twice).

// alchemy.run.ts binds WEBSITE to the website Worker (Alchemy types a Worker binding as the
// resource, not the service binding it deploys). CRON_SECRET is a Worker secret (wrangler secret
// put), the same one the website checks.
type Env = {
	WEBSITE: { fetch(url: string, init?: RequestInit): Promise<Response> };
	WEBSITE_URL: string;
	CRON_SECRET?: string;
};

export default {
	async scheduled(_controller: unknown, env: Env) {
		if (!env.CRON_SECRET) {
			console.error('Transcript cron: CRON_SECRET is not set');
			return;
		}
		try {
			const response = await env.WEBSITE.fetch(`${env.WEBSITE_URL}/webhooks/transcripts`, {
				headers: { authorization: `Bearer ${env.CRON_SECRET}` }
			});
			const message = `Transcript cron: ${response.status} ${await response.text()}`;
			if (response.ok) console.log(message);
			else console.error(message);
		} catch (error) {
			console.error('Transcript cron: the website request failed', error);
		}
	}
};
