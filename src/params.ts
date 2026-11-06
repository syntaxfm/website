import { defineParams } from '@sveltejs/kit/params';

// Not `dev` from $app/env: SvelteKit 3 also imports this file in plain Node at build time to check
// the matchers exist (load_and_validate_params), where $app/* doesn't resolve and import.meta.env is
// unset. Vite sets import.meta.env in the app, so dev is true only on the dev server.
const dev = Boolean(import.meta.env?.DEV);

// Development paths the client router must load as full pages, never as client-side routes:
// - the dev server's Syntax Auth gateway (@syntaxfm/auth-local, see vite.config.ts), served outside
//   SvelteKit, so it has no page data to fetch;
// - the Syntax Auth diagnostic page the auth hook renders itself, without a route
//   (SYNTAX_AUTH_DIAGNOSTIC_PATH in src/server/auth/syntax_auth_failure.ts).
// Leaving them unmatched makes the client router load them as full pages, the way it treats any
// path no route claims.
const DEVELOPMENT_RESERVED_SEGMENTS = ['__syntax_auth', '__syntax_auth_unavailable'];

/** Matches every path, except the dev Syntax Auth gateway and diagnostic page in development. */
function is_app_path(param: string) {
	if (!dev) return true;
	return !DEVELOPMENT_RESERVED_SEGMENTS.some(
		(segment) => param === segment || param.startsWith(`${segment}/`)
	);
}

/** A three-digit show number, e.g. 900. */
function is_show_number(param: string) {
	return /^[0-9]{3}$/.test(param);
}

export const params = defineParams({
	app_path: (param) => (is_app_path(param) ? param : undefined),
	show_number: (param) => (is_show_number(param) ? param : undefined)
});
