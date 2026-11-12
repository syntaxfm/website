// The website's Alchemy stack (modelled on ../syntax-lab/alchemy.run.ts). `pnpm deploy:beta` deploys
// it to beta.syntax.fm: the SvelteKit app as a Cloudflare Worker, its Hyperdrive connection to
// PlanetScale Postgres, and its secrets. Secrets come from 1Password through varlock at deploy time
// (USE_1PASSWORD=true, see .env.schema / .env.1password). Local work stays on `pnpm dev` (Node).
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

// The app's secrets (CRON_SECRET, Kit, Deepgram, Megaphone, OpenAI, YouTube) aren't here: they're
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

export default Alchemy.Stack(
	'SyntaxWebsite',
	{ providers: Cloudflare.providers(), state: state_store },
	Effect.gen(function* () {
		const website = yield* syntax_website;
		return { url: website.url };
	})
);
