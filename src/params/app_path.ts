import { dev } from '$app/environment';
import type { ParamMatcher } from '@sveltejs/kit';

// Development paths the client router must load as full pages, never as client-side routes:
// - the dev server's Syntax Auth gateway (@syntaxfm/auth-local, see vite.config.ts), served outside
//   SvelteKit, so it has no page data to fetch;
// - the Syntax Auth diagnostic page the auth hook renders itself, without a route
//   (SYNTAX_AUTH_DIAGNOSTIC_PATH in src/server/auth/syntax_auth_failure.ts).
// Leaving them unmatched makes the client router load them as full pages, the way it treats any
// path no route claims.
const DEVELOPMENT_RESERVED_SEGMENTS = ['__syntax_auth', '__syntax_auth_unavailable'];

/** Matches every path, except the dev Syntax Auth gateway and diagnostic page in development. */
export const match = ((param) => {
	if (!dev) return true;
	return !DEVELOPMENT_RESERVED_SEGMENTS.some(
		(segment) => param === segment || param.startsWith(`${segment}/`)
	);
}) satisfies ParamMatcher;
