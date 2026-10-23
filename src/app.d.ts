// See https://svelte.dev/docs/kit/types#app.d.ts
import type { UserWithRoles } from '#server/auth/users.js';
import type { PrismaClient } from '@prisma/client';
// Import the relevant types

// for information about these interfaces
declare global {
	declare namespace svelteHTML {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		interface HTMLAttributes<T> {
			'onclick-outside'?: (event: CustomEvent<any>) => void;
		}
	}
	interface Window {
		webkitAudioContext: typeof AudioContext;
	}

	namespace App {
		// interface Error {}
		interface Locals {
			prisma: PrismaClient;
			form_data: Record<string, unknown>;
			session: {
				ip: string;
				country: string;
			};
			user: UserWithRoles | null;
			theme: string;
		}

		// interface PageData {}
		// interface Platform {}
	}

	interface Document {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		startViewTransition: (callback: any) => void; // Add your custom property/method here
	}
}

export {};
