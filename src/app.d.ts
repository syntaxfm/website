// See https://kit.svelte.dev/docs/types#app
import type { SyntaxWebsiteEnv } from '../alchemy.run.ts';
// Import the relevant types

// for information about these interfaces
declare global {
	declare namespace svelteHTML {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		interface HTMLAttributes<T> {
			popover?: string | boolean | null;
			popovertarget?: string | null;
			'onclick-outside'?: (event: CustomEvent<unknown>) => void;
		}
	}
	interface Window {
		webkitAudioContext: typeof AudioContext;
	}

	interface MapConstructor<K, V> {
		groupBy: <T>(callback: (value: V, key: K) => T) => Map<T, Map<K, V>>;
	}

	namespace App {
		// interface Error {}
		// The signed-in user isn't here: ask server/auth/request_auth.ts, which asks Syntax Auth only
		// when needed
		interface Locals {
			form_data: Record<string, unknown>;
			request_metadata: {
				ip: string | null;
				country: string | null;
			};
		}

		// A page's search and sharing tags, rendered once by #lib/meta/Meta.svelte. Unset fields fall
		// back to the site's own.
		interface PageData {
			meta?: {
				title?: string;
				description?: string | null;
				canonical?: string;
				image?: string;
				url?: string;
				// ISO dates. A page with a published date is an article (an episode, a newsletter issue).
				published?: string;
				modified?: string;
				// A page with nothing worth finding yet (an episode's transcript before it's made)
				noindex?: boolean;
			};
		}
		// What Alchemy's Worker shim passes: bindings (alchemy.run.ts), the execution context and the
		// Cache API. Absent under `pnpm dev`, which runs on Node.
		interface Platform {
			env: Partial<SyntaxWebsiteEnv>;
			ctx?: { waitUntil(promise: Promise<unknown>): void };
			caches?: CacheStorage & { default?: Cache };
		}
	}

	interface Document {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		startViewTransition: (callback: any) => void; // Add your custom property/method here
	}
}

export {};
