// Runs after `alchemy deploy` (pnpm deploy:beta). The Worker caches pages in Cloudflare's edge
// cache, and a cached page names the JS/CSS files of the build that rendered it. A deploy
// replaces those files, so pages cached before it would load missing files (404s, no hydration).
// Purging the beta hostname makes the next request render with the new build. Uses Alchemy's
// Cloudflare login, so it needs no token of its own.
import * as Cloudflare from '@alchemy.run/cloudflare';
import * as Auth from 'alchemy/Auth';
import * as NodeHttpClient from '@effect/platform-node/NodeHttpClient';
import * as NodeServices from '@effect/platform-node/NodeServices';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';

const BETA_HOST = 'beta.syntax.fm';
const SYNTAX_ZONE_ID = '8ae25a4028e93b0cbb671435aab8acb0'; // syntax.fm

const purge = Effect.gen(function* () {
	const resolve_credentials = yield* Cloudflare.CloudflareEnvironment;
	const credentials = yield* resolve_credentials;
	if (credentials.type === 'apiKey') {
		return yield* Effect.die(
			new Error('Expected an Alchemy OAuth or API token login, not an API key')
		);
	}
	const token = credentials.type === 'oauth' ? credentials.accessToken : credentials.apiToken;
	const response = yield* Effect.promise(() =>
		fetch(`https://api.cloudflare.com/client/v4/zones/${SYNTAX_ZONE_ID}/purge_cache`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${Redacted.value(token)}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ hosts: [BETA_HOST] })
		})
	);
	const result = (yield* Effect.promise(() => response.json())) as {
		success: boolean;
		errors: unknown[];
	};
	if (!result.success) {
		return yield* Effect.die(
			new Error(`Purging ${BETA_HOST} failed: ${JSON.stringify(result.errors)}`)
		);
	}
	console.log(`Purged the edge cache for ${BETA_HOST}`);
});

await Effect.runPromise(
	purge.pipe(
		Effect.provide(
			Cloudflare.CloudflareApiLive().pipe(
				Layer.orDie,
				Layer.provideMerge(
					Layer.mergeAll(NodeServices.layer, NodeHttpClient.layerUndici, Auth.AuthProvidersLive)
				)
			)
		)
	)
);
