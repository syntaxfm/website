import { vi } from 'vitest';

// Syntax Auth's access tokens for tests: a fresh Ed25519 key pair, its published key set, and
// tokens signed the way Better Auth's oauth-provider signs them (EdDSA, `kid` in the header; `sub`,
// `aud`, `azp`, `scope`, `iss`, `iat` and `exp` in the claims). Nothing here is a real credential.

type TokenJson = { [key: string]: unknown };

function to_base64_url(bytes: Uint8Array) {
	return btoa(String.fromCodePoint(...bytes))
		.replaceAll('+', '-')
		.replaceAll('/', '_')
		.replace(/=+$/u, '');
}

function encode_segment(segment: TokenJson) {
	return to_base64_url(new TextEncoder().encode(JSON.stringify(segment)));
}

/** A signing key and its key ID, as Syntax Auth's JWKS would publish it. */
export async function open_signing_key_fixture(key_id: string) {
	const key_pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
	const public_jwk = await crypto.subtle.exportKey('jwk', key_pair.publicKey);

	/** A token with claims, signed by this key under header_key_id (its own ID by default). */
	async function sign_access_token(claims: TokenJson, header_key_id = key_id) {
		const signed_text = `${encode_segment({ alg: 'EdDSA', kid: header_key_id })}.${encode_segment(claims)}`;
		const signature = await crypto.subtle.sign(
			{ name: 'Ed25519' },
			key_pair.privateKey,
			new TextEncoder().encode(signed_text)
		);
		return `${signed_text}.${to_base64_url(new Uint8Array(signature))}`;
	}

	return {
		published_key: { kid: key_id, kty: 'OKP', crv: 'Ed25519', x: public_jwk.x ?? '', alg: 'EdDSA' },
		sign_access_token
	};
}

/** A token whose header claims `alg: none` and carries no signature. */
export function unsigned_access_token_fixture(claims: TokenJson) {
	return `${encode_segment({ alg: 'none', kid: 'syntax-auth-key-1' })}.${encode_segment(claims)}.`;
}

/** The claims of a token production Syntax Auth issued for beta.syntax.fm/mcp, valid for an hour. */
export function access_token_claims_fixture(central_user_id: string) {
	const issued_at = Math.floor(Date.now() / 1000);
	return {
		sub: central_user_id,
		aud: 'https://beta.syntax.fm/mcp',
		azp: 'tasty-mcp-client',
		scope: 'openid profile email offline_access',
		iss: 'https://auth.syntax.fm/api/auth',
		iat: issued_at,
		exp: issued_at + 3600
	};
}

/**
 * Stands in for fetch to Syntax Auth's key set: answers with published_keys, or with
 * answer.failure (an HTTP status or a thrown error) while one is set.
 */
export function key_set_fetch_fixture(published_keys: readonly TokenJson[]) {
	const answer: { failure: number | Error | null } = { failure: null };

	const key_set_fetch = vi.fn(async (key_set_url: string, _init: RequestInit) => {
		if (answer.failure instanceof Error) throw answer.failure;
		if (answer.failure !== null) {
			return new Response('{"message":"Too many requests"}', { status: answer.failure });
		}
		return Response.json(
			key_set_url === 'https://auth.syntax.fm/api/auth/jwks'
				? { keys: published_keys }
				: { keys: [] }
		);
	});

	return { key_set_fetch, answer };
}
