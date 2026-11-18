import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { SYNTAX_AUTH_ISSUER } from '$server/auth/syntax_auth';

import { MCP_PATHNAME, MCP_RESOURCE_METADATA_PATHNAME } from './mcp_route';

// How an agent signs in to the MCP endpoint. The agent runs Syntax Auth's OAuth flow itself
// (dynamic client registration and PKCE) and sends the access token as `Authorization: Bearer`.
// Syntax Auth issues it as a JWT signed with its published key (EdDSA, Ed25519). The website checks
// it without asking Syntax Auth per request: the signature against Syntax Auth's keys, then `iss`,
// `aud` (this site's own /mcp URL, so a token for another service is refused), `exp`, `nbf` and
// `sub`. No token is stored, logged or sent anywhere. A token stays valid until it expires after a
// central sign-out; roles are read again on every request, so a removed admin loses access at once.
// Same checks as Syntax Lab's MCP endpoint (syntax-lab: src/lib/mcp/lab-mcp-sign-in.server.ts).

/** The scopes an agent asks for. offline_access gets it a refresh token. */
export const MCP_SCOPES = ['openid', 'profile', 'email', 'offline_access'] as const;

const SIGN_IN_MESSAGE = 'Sign in to Syntax with Syntax Auth to use its MCP endpoint.';
const KEYS_UNAVAILABLE_MESSAGE =
	"Syntax couldn't check your sign-in with Syntax Auth. Try again in a moment.";

// Syntax Auth's keys are cached per Worker isolate: only public keys, the same for every request,
// so sharing them leaks nothing. Anyone can send a token, so the key set is read at most once per
// KEY_REFETCH_INTERVAL_MS, failed reads included: requests that arrive during a read wait for it,
// and between reads an unknown key ID is refused (401) and a missing key set is a 503.
const KEY_LIFETIME_MS = 5 * 60 * 1000;
const KEY_REFETCH_INTERVAL_MS = 30 * 1000;
// A read another request started can stop without settling (on Workers, when that request is
// cancelled), so a waiter gives up after this, and later requests no longer wait for that read.
const KEY_FETCH_TIMEOUT_MS = 10 * 1000;

export type KeySetFetch = (url: string, init: RequestInit) => Promise<Response>;

const key_id_schema = Schema.NonEmptyString;

// EdDSA only, so a token can't pick a weaker algorithm (or `none`)
const token_header_schema = Schema.Struct({ alg: Schema.Literal('EdDSA'), kid: key_id_schema });

// Better Auth's oauth-provider signs `sub`, `aud`, `azp`, `scope`, `iss`, `iat` and `exp`. Only the
// ones checked here are decoded; the rest are dropped.
const token_claims_schema = Schema.Struct({
	iss: Schema.String,
	sub: Schema.NonEmptyString,
	aud: Schema.Union([Schema.String, Schema.Array(Schema.String)]),
	exp: Schema.Finite,
	nbf: Schema.optionalKey(Schema.Finite)
});

export type McpTokenClaims = typeof token_claims_schema.Type;

// One of Syntax Auth's published keys: an Ed25519 public key
const published_key_schema = Schema.Struct({
	kid: key_id_schema,
	kty: Schema.Literal('OKP'),
	crv: Schema.Literal('Ed25519'),
	x: Schema.NonEmptyString
});

type PublishedKey = typeof published_key_schema.Type;

// A key the site can't use (another type or curve) is skipped, not an error
const key_set_schema = Schema.Struct({ keys: Schema.Array(Schema.Unknown) });

const decode_header = Schema.decodeUnknownOption(Schema.fromJsonString(token_header_schema));
const decode_claims = Schema.decodeUnknownOption(Schema.fromJsonString(token_claims_schema));
const decode_published_key = Schema.decodeUnknownOption(published_key_schema);
const decode_key_set = Schema.decodeUnknownOption(key_set_schema);

/** What the token check found: the caller's verified claims, or the response that refuses them. */
export type McpTokenCheck =
	| { is_signed_in: true; claims: McpTokenClaims }
	| { is_signed_in: false; response: Response };

// Why a token was refused. The message goes to the agent and never quotes the token.
class TokenRefusedError extends Error {}

// Syntax Auth's keys couldn't be read: unreachable, or an answer that isn't a key set
class KeysUnavailableError extends Error {}

type KeyFetchResult = { keys: PublishedKey[] } | { failure: unknown };

interface PendingKeyFetch {
	settled: Promise<KeyFetchResult>;
	started_at_ms: number;
}

interface KeySetState {
	// The last key set read, or null before the first
	keys: PublishedKey[] | null;
	fetched_at_ms: number;
	// The last read started, whether it worked or not
	attempted_at_ms: number;
	pending: PendingKeyFetch | null;
}

const KEY_SET_BEFORE_FIRST_FETCH: KeySetState = {
	keys: null,
	fetched_at_ms: Number.NEGATIVE_INFINITY,
	attempted_at_ms: Number.NEGATIVE_INFINITY,
	pending: null
};

const key_set_cache = new Map<string, KeySetState>();

async function fetch_key_set(key_set_url: string, key_set_fetch: KeySetFetch) {
	const response = await key_set_fetch(key_set_url, {
		method: 'GET',
		headers: { Accept: 'application/json' },
		cache: 'no-store'
	});
	if (!response.ok) {
		throw new Error(`Syntax Auth answered its key set with HTTP ${response.status}`);
	}

	const key_set = decode_key_set(await response.json());
	if (Option.isNone(key_set)) throw new Error("Syntax Auth's key set isn't a JWKS");

	return key_set.value.keys.flatMap((key) => Option.toArray(decode_published_key(key)));
}

/**
 * Starts the one key set read for key_set_url and records it, so concurrent requests share it.
 * When it settles, a fetched set replaces the cached one; a failed read keeps the old set.
 */
function start_key_fetch(
	key_set_url: string,
	key_set_fetch: KeySetFetch,
	now_ms: number
): PendingKeyFetch {
	const settled: Promise<KeyFetchResult> = fetch_key_set(key_set_url, key_set_fetch).then(
		(keys): KeyFetchResult => ({ keys }),
		(failure: unknown): KeyFetchResult => ({ failure })
	);
	const pending: PendingKeyFetch = { settled, started_at_ms: now_ms };

	key_set_cache.set(key_set_url, {
		...(key_set_cache.get(key_set_url) ?? KEY_SET_BEFORE_FIRST_FETCH),
		attempted_at_ms: now_ms,
		pending
	});

	void settled.then((result) => {
		const state = key_set_cache.get(key_set_url) ?? KEY_SET_BEFORE_FIRST_FETCH;
		const is_fetched = 'keys' in result;
		key_set_cache.set(key_set_url, {
			keys: is_fetched ? result.keys : state.keys,
			fetched_at_ms: is_fetched ? Date.now() : state.fetched_at_ms,
			attempted_at_ms: state.attempted_at_ms,
			pending: state.pending === pending ? null : state.pending
		});
	});

	return pending;
}

function wait_for_key_fetch(pending: PendingKeyFetch, now_ms: number) {
	const remaining_ms = pending.started_at_ms + KEY_FETCH_TIMEOUT_MS - now_ms;
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<KeyFetchResult>((resolve) => {
		timer = setTimeout(
			() => resolve({ failure: new Error("Syntax Auth didn't answer for its keys in time") }),
			remaining_ms
		);
	});

	return Promise.race([pending.settled, timeout]).finally(() => clearTimeout(timer));
}

/** The published key key_id, from the cache, the read in progress, or a new read; or null. */
async function find_published_key(
	key_set_url: string,
	key_id: string,
	key_set_fetch: KeySetFetch
): Promise<PublishedKey | null> {
	const state = key_set_cache.get(key_set_url) ?? KEY_SET_BEFORE_FIRST_FETCH;
	const now_ms = Date.now();

	const fresh_keys: PublishedKey[] | null =
		now_ms - state.fetched_at_ms < KEY_LIFETIME_MS ? state.keys : null;
	const cached_key = fresh_keys?.find((key: PublishedKey) => key.kid === key_id);
	if (cached_key) return cached_key;

	const pending =
		state.pending && now_ms - state.pending.started_at_ms < KEY_FETCH_TIMEOUT_MS
			? state.pending
			: null;
	const may_refetch = now_ms - state.attempted_at_ms >= KEY_REFETCH_INTERVAL_MS;

	if (!pending && !may_refetch) {
		if (fresh_keys) return null;
		throw new KeysUnavailableError(
			"Syntax Auth's keys couldn't be read recently; waiting before trying again"
		);
	}

	const result = await wait_for_key_fetch(
		pending ?? start_key_fetch(key_set_url, key_set_fetch, now_ms),
		now_ms
	);
	if ('failure' in result) {
		throw new KeysUnavailableError("Syntax Auth's keys couldn't be read", {
			cause: result.failure
		});
	}

	return result.keys.find((key) => key.kid === key_id) ?? null;
}

// A JWT segment's bytes: base64url without padding (RFC 7515)
function decode_base64_url(segment: string): Uint8Array<ArrayBuffer> {
	const base64_text = segment.replaceAll('-', '+').replaceAll('_', '/');
	return Uint8Array.from(atob(base64_text), (character) => character.codePointAt(0) ?? 0);
}

function decode_segment_text(segment: string): string {
	try {
		return new TextDecoder().decode(decode_base64_url(segment));
	} catch {
		throw new TokenRefusedError("The access token isn't a JWT.");
	}
}

async function verify_signature(key: PublishedKey, signed_text: string, signature: string) {
	const is_valid = await crypto.subtle
		.importKey('jwk', { kty: key.kty, crv: key.crv, x: key.x }, { name: 'Ed25519' }, false, [
			'verify'
		])
		.then((verification_key) =>
			crypto.subtle.verify(
				{ name: 'Ed25519' },
				verification_key,
				decode_base64_url(signature),
				new TextEncoder().encode(signed_text)
			)
		)
		.catch(() => {
			throw new TokenRefusedError("The access token's signature couldn't be checked.");
		});
	if (!is_valid) throw new TokenRefusedError("The access token's signature is invalid.");
}

// Times are whole seconds since the epoch
function check_claims(claims: McpTokenClaims, expected_audience: string) {
	const now_seconds = Date.now() / 1000;

	if (claims.iss !== SYNTAX_AUTH_ISSUER) {
		throw new TokenRefusedError('The access token is from another issuer.');
	}
	if (![claims.aud].flat().includes(expected_audience)) {
		throw new TokenRefusedError("The access token isn't for this site's MCP endpoint.");
	}
	if (claims.exp <= now_seconds) {
		throw new TokenRefusedError('The access token has expired.');
	}
	if (claims.nbf !== undefined && claims.nbf > now_seconds) {
		throw new TokenRefusedError("The access token isn't valid yet.");
	}
}

async function verify_access_token(
	access_token: string,
	app_origin: string,
	key_set_fetch: KeySetFetch
): Promise<McpTokenClaims> {
	const segments = access_token.split('.');
	const [header_segment, claims_segment, signature_segment] = segments;
	if (
		segments.length !== 3 ||
		header_segment === undefined ||
		claims_segment === undefined ||
		signature_segment === undefined
	) {
		throw new TokenRefusedError("The access token isn't a JWT.");
	}

	const header = decode_header(decode_segment_text(header_segment));
	if (Option.isNone(header)) {
		throw new TokenRefusedError("The access token isn't one Syntax Auth issued for this site.");
	}

	const key = await find_published_key(
		`${SYNTAX_AUTH_ISSUER}/jwks`,
		header.value.kid,
		key_set_fetch
	);
	if (!key) {
		throw new TokenRefusedError(
			"The access token was signed with a key Syntax Auth doesn't publish."
		);
	}

	await verify_signature(key, `${header_segment}.${claims_segment}`, signature_segment);

	const claims = decode_claims(decode_segment_text(claims_segment));
	if (Option.isNone(claims)) {
		throw new TokenRefusedError("The access token isn't one Syntax Auth issued for this site.");
	}

	check_claims(claims.value, `${app_origin}${MCP_PATHNAME}`);
	return claims.value;
}

/** `Authorization: Bearer <token>`'s token, or null. The scheme is case-insensitive (RFC 9110). */
function read_bearer_token(authorization_header: string | null): string | null {
	const bearer_match = /^bearer +(\S+)$/iu.exec(authorization_header?.trim() ?? '');
	return bearer_match?.[1] ?? null;
}

/**
 * The 401 an agent gets without a valid token. WWW-Authenticate points it at the endpoint's
 * Protected Resource Metadata, which names Syntax Auth (MCP authorization, RFC 9728).
 */
function sign_in_required_response(app_origin: string, is_token_sent: boolean, message: string) {
	const challenge = [
		`resource_metadata="${app_origin}${MCP_RESOURCE_METADATA_PATHNAME}"`,
		`scope="${MCP_SCOPES.join(' ')}"`,
		...(is_token_sent ? ['error="invalid_token"'] : [])
	];

	return Response.json(
		{ error: { status: 401, message } },
		{
			status: 401,
			headers: {
				'WWW-Authenticate': `Bearer ${challenge.join(', ')}`,
				'Cache-Control': 'no-store'
			}
		}
	);
}

/**
 * Checks the request's access token. A missing or refused token is a 401 with WWW-Authenticate;
 * Syntax Auth's keys being unreachable is a 503. Neither the token nor Syntax Auth's answer is
 * logged. key_set_fetch is for tests; the app uses the platform's fetch.
 */
export async function check_mcp_access_token(
	request: Request,
	key_set_fetch: KeySetFetch = (url, init) => fetch(url, init)
): Promise<McpTokenCheck> {
	const app_origin = new URL(request.url).origin;
	const access_token = read_bearer_token(request.headers.get('Authorization'));

	if (access_token === null) {
		return {
			is_signed_in: false,
			response: sign_in_required_response(app_origin, false, SIGN_IN_MESSAGE)
		};
	}

	try {
		return {
			is_signed_in: true,
			claims: await verify_access_token(access_token, app_origin, key_set_fetch)
		};
	} catch (check_error) {
		if (check_error instanceof TokenRefusedError) {
			return {
				is_signed_in: false,
				response: sign_in_required_response(app_origin, true, check_error.message)
			};
		}
		if (check_error instanceof KeysUnavailableError) {
			console.error('MCP sign-in failed: Syntax Auth keys unavailable', check_error);
			return {
				is_signed_in: false,
				response: Response.json(
					{ error: { status: 503, message: KEYS_UNAVAILABLE_MESSAGE } },
					{ status: 503, headers: { 'Cache-Control': 'no-store' } }
				)
			};
		}
		throw check_error;
	}
}
