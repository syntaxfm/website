// Cloudflare runs this on the schedules in alchemy.run.ts. Each schedule asks the website, through
// a service binding, to run one job:
// - every 20 minutes: transcribe the newest released episode without a transcript
// - Mondays: take the weekly SEO snapshot
// - hourly: copy new YouTube videos into the site (the whole channel once a day)
// It never throws, so Cloudflare never retries a run (a retry could pay Grok or Firecrawl twice).

// alchemy.run.ts binds WEBSITE to the website Worker (Alchemy types a Worker binding as the
// resource, not the service binding it deploys). CRON_SECRET is a Worker secret (wrangler secret
// put), the same one the website checks.
type Env = {
	WEBSITE: { fetch(url: string, init?: RequestInit): Promise<Response> };
	WEBSITE_URL: string;
	TRANSCRIPT_SCHEDULE: string;
	SEO_SCHEDULE: string;
	VIDEO_SCHEDULE: string;
	CRON_SECRET?: string;
};

export default {
	async scheduled(controller: { cron: string }, env: Env) {
		const jobs: Record<string, string> = {
			[env.TRANSCRIPT_SCHEDULE]: '/webhooks/transcripts',
			[env.SEO_SCHEDULE]: '/webhooks/seo',
			[env.VIDEO_SCHEDULE]: '/webhooks/videos'
		};
		const path = jobs[controller.cron];
		if (!path) {
			console.error(`Cron: no job for the schedule ${controller.cron}`);
			return;
		}
		if (!env.CRON_SECRET) {
			console.error('Cron: CRON_SECRET is not set');
			return;
		}
		try {
			const response = await env.WEBSITE.fetch(`${env.WEBSITE_URL}${path}`, {
				headers: { authorization: `Bearer ${env.CRON_SECRET}` }
			});
			const message = `Cron ${path}: ${response.status} ${await response.text()}`;
			if (response.ok) console.log(message);
			else console.error(message);
		} catch (error) {
			console.error(`Cron ${path}: the website request failed`, error);
		}
	}
};
