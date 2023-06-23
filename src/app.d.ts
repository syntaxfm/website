// See https://kit.svelte.dev/docs/types#app

import type { User } from '@prisma/client';
import { PrismaClient } from '@prisma/client/index.d.ts';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			prisma: PrismaClient;
			form_data: Record<string, unknown>;
			session: {
				ip: string;
				country: string;
			};
			user: User | null;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
