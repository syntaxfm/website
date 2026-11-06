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
import * as Redacted from 'effect/Redacted';

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

// PlanetScale Postgres, from the PROD_DATABASE_URL secret. Hyperdrive pools connections near the
// database; it's PlanetScale's recommended path for Workers (direct connections time out).
const database_origin = Effect.gen(function* () {
	const url = new URL(Redacted.value(yield* Config.Redacted('PROD_DATABASE_URL')));
	return {
		scheme: 'postgres' as const,
		host: url.hostname,
		port: Number(url.port || 5432),
		database: url.pathname.slice(1),
		user: decodeURIComponent(url.username),
		password: Redacted.make(decodeURIComponent(url.password))
	};
});

const syntax_database = Cloudflare.Hyperdrive.Connection(
	'SyntaxDatabase',
	// A missing or unreadable PROD_DATABASE_URL stops the deploy
	database_origin.pipe(
		Effect.map((origin) => ({ origin })),
		Effect.orDie
	)
);

// Everything the app reads at runtime: $app/env/private reads the secrets from the Worker env, and
// src/server/db/client.ts reads HYPERDRIVE from platform.env.
const secret = (name: string) => Config.Redacted(name);

// The spam check on the user submission form (Potluck questions and the like)
const submission_turnstile = Cloudflare.Turnstile.Widget('SubmissionForm', {
	name: 'syntax-website-beta-submissions',
	domains: [BETA_DOMAIN],
	mode: 'managed'
});

// A missing secret stops the deploy
export const website_props = Effect.gen(function* () {
	const turnstile = yield* submission_turnstile;
	return {
		domain: BETA_DOMAIN,
		workersDev: false,
		compatibility: COMPATIBILITY,
		env: {
			HYPERDRIVE: syntax_database,
			PUBLIC_TURNSTILE_SITE_KEY: turnstile.sitekey,
			TURNSTILE_SECRET: turnstile.secret,
			CONVERT_KIT_SECRET: yield* secret('CONVERT_KIT_SECRET'),
			CONVERT_KIT_V4_API_KEY: yield* secret('CONVERT_KIT_V4_API_KEY'),
			DEEPGRAM_SECRET: yield* secret('DEEPGRAM_SECRET'),
			MEGAPHONE_API_TOKEN: yield* secret('MEGAPHONE_API_TOKEN'),
			MEGAPHONE_NETWORK_ID: yield* secret('MEGAPHONE_NETWORK_ID'),
			OPENAI_API_KEY: yield* secret('OPENAI_API_KEY'),
			YOUTUBE_API_KEY: yield* secret('YOUTUBE_API_KEY')
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
