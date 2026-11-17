// The website's Alchemy stack (modelled on ../syntax-lab/alchemy.run.ts). `pnpm deploy:beta` deploys
// it to beta.syntax.fm: the SvelteKit app as a Cloudflare Worker, its Hyperdrive connection to
// PlanetScale Postgres, and its Turnstile keys. The app's other secrets are set on the Worker (see
// below). Local work stays on `pnpm dev` (Node).
import * as Alchemy from 'alchemy';
import * as Cloudflare from '@alchemy.run/cloudflare';
import * as Config from 'effect/Config';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

// The Syntax Cloudflare account: syntax.fm's zone, Syntax Auth and Syntax Lab. Alchemy takes the
// account from its profile or CLOUDFLARE_ACCOUNT_ID, not from the stack, so the stack checks it.
const SYNTAX_CLOUDFLARE_ACCOUNT_ID = '3ebe60b8bb090efeda7702aff60769bb';

// The website's only Alchemy stage for now. Alchemy's default stage is `dev_<user>`, so a bare
// `alchemy deploy` would otherwise create a second copy of everything.
const BETA_STAGE = 'beta';
const BETA_DOMAIN = 'beta.syntax.fm';

// nodejs_compat: postgres.js, Deepgram streams and Sentry use Node APIs
const COMPATIBILITY = { date: '2026-11-01', flags: ['nodejs_compat'] };

// No placement: measured 2026-11-06 from Denver, pinning the Worker to the database's region
// (aws:us-east-1) added ~55 ms to every request (robots.txt 72 -> 131 ms, page data 80 -> 125-190
// ms) and only helped the two oversized remote queries. Fix those instead.

class DeployTargetError extends Data.TaggedError('DeployTargetError')<{
	readonly message: string;
}> {}

const require_beta_stage = Effect.gen(function* () {
	const stage = yield* Alchemy.Stage;
	if (stage !== BETA_STAGE) {
		return yield* Effect.die(
			new DeployTargetError({
				message: `The website deploys only to the \`${BETA_STAGE}\` stage (${BETA_DOMAIN}), but this run's stage is \`${stage}\`. Use \`pnpm deploy:beta\`.`
			})
		);
	}
});

const require_syntax_account = Effect.gen(function* () {
	const resolve_credentials = yield* Cloudflare.CloudflareEnvironment;
	const { accountId: account_id } = yield* resolve_credentials;
	if (account_id !== SYNTAX_CLOUDFLARE_ACCOUNT_ID) {
		return yield* Effect.die(
			new DeployTargetError({
				message:
					`The website runs only in the Syntax Cloudflare account (${SYNTAX_CLOUDFLARE_ACCOUNT_ID}), ` +
					`but Alchemy resolved account ${account_id}. Connect Alchemy to it with ` +
					'`pnpm exec alchemy profile edit --reconfigure Cloudflare`.'
			})
		);
	}
});

// Deploy state lives in the Syntax account's shared, encrypted `alchemy-state-store` (the same
// one Syntax Lab uses), checked before first use: Cloudflare.state() deploys its store into
// whichever account Alchemy resolved.
const state_store = Layer.unwrap(
	Effect.gen(function* () {
		yield* require_beta_stage;
		yield* require_syntax_account.pipe(
			Effect.provide(Cloudflare.CloudflareApiLive().pipe(Layer.orDie))
		);
		return Cloudflare.state();
	})
);

// PlanetScale Postgres through Hyperdrive (PlanetScale's recommended path for Workers; direct
// connections time out). Looked up by name, so a deploy never needs the database password: the
// connection was created by an earlier version of this stack and kept (RemovalPolicy.retain).
// Changing its origin (a new host or password) is done on the Hyperdrive config in Cloudflare.
// Its origin connection limit is 12 (set there 2026-11-17): the database allows 25 connections, and
// at 60 Hyperdrive asked for more than exist, so pages failed right after each deploy. Keep it
// below the database's limit (Hyperdrive's is soft). Connect on 5432, not PgBouncer's 6432:
// Hyperdrive pools already, and PgBouncer doesn't keep prepared statements across transactions.
const syntax_database = Cloudflare.Hyperdrive.lookup('SyntaxDatabase', {
	name: 'syntaxwebsite-syntaxdatabase-beta-jaw3qpwy5oak63dt'
});

// The spam check on the user submission form (Potluck questions and the like) and the
// newsletter signup card
const submission_turnstile = Cloudflare.Turnstile.Widget('SubmissionForm', {
	name: 'syntax-website-beta-submissions',
	domains: [BETA_DOMAIN],
	mode: 'managed'
});

// Share (OG) images: rendered once with Cloudflare's browser (BROWSER), then kept here
// (src/server/og/og_image.ts)
const og_images = Cloudflare.R2.Bucket('OgImages');

// The app's secrets (CRON_SECRET, Kit, xAI, Megaphone, OpenAI, YouTube) aren't here: they're
// set on the Worker itself (Cloudflare dashboard, or wrangler secret put) and Alchemy leaves
// secrets it didn't upload alone. So a deploy, including one Cloudflare runs on every push to v_3,
// needs no 1Password. $app/env/private reads them from the Worker env.
export const website_props = Effect.gen(function* () {
	const turnstile = yield* submission_turnstile;
	return {
		domain: BETA_DOMAIN,
		workersDev: false,
		compatibility: COMPATIBILITY,
		env: {
			HYPERDRIVE: syntax_database,
			BROWSER: Cloudflare.Browser(),
			OG_IMAGES: og_images,
			PUBLIC_TURNSTILE_SITE_KEY: turnstile.sitekey,
			TURNSTILE_SECRET: turnstile.secret,
			// Not secret: set in .env.schema
			MEGAPHONE_PODCAST_ID: yield* Config.String('MEGAPHONE_PODCAST_ID')
		}
	};
}).pipe(Effect.orDie);

const syntax_website = Cloudflare.Website.SvelteKit('SyntaxWebsite', website_props);

export type SyntaxWebsiteEnv = Cloudflare.InferEnv<typeof syntax_website>;

// The website's scheduled jobs: a small Worker whose crons ask the website to run them, since the
// SvelteKit Worker can't take a `scheduled` handler of its own. CRON_SECRET is set on it like the
// website's secrets. Transcripts (src/routes/webhooks/transcripts) one episode at a time; the SEO
// snapshot (src/routes/webhooks/seo) Mondays at 14:00 UTC, 7am in Denver; episodes from the
// shows/ markdown files (src/routes/webhooks/refresh) hourly, then YouTube videos
// (src/routes/webhooks/videos) ten minutes later, so a new episode's YouTube video is already
// known as an episode. Its id stays TranscriptCron from when it only ran transcripts: a new id
// would be a new Worker without the secret.
const TRANSCRIPT_SCHEDULE = '*/20 * * * *';
const SEO_SCHEDULE = '0 14 * * 1';
const SHOW_SCHEDULE = '5 * * * *';
const VIDEO_SCHEDULE = '15 * * * *';
const scheduled_jobs = Cloudflare.Worker('TranscriptCron', {
	main: './workers/scheduled_jobs.ts',
	compatibility: { date: COMPATIBILITY.date },
	crons: [TRANSCRIPT_SCHEDULE, SEO_SCHEDULE, SHOW_SCHEDULE, VIDEO_SCHEDULE],
	workersDev: false,
	observability: { enabled: true },
	env: {
		WEBSITE: syntax_website,
		WEBSITE_URL: `https://${BETA_DOMAIN}`,
		TRANSCRIPT_SCHEDULE,
		SEO_SCHEDULE,
		SHOW_SCHEDULE,
		VIDEO_SCHEDULE
	}
});

export default Alchemy.Stack(
	'SyntaxWebsite',
	{ providers: Cloudflare.providers(), state: state_store },
	Effect.gen(function* () {
		const website = yield* syntax_website;
		yield* scheduled_jobs;
		return { url: website.url };
	})
);
