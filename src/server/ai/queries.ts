import type { InferSelectModel } from 'drizzle-orm';
import type { show as shows, topic as topics } from '$server/db/schema';

export type LatestShow = InferSelectModel<typeof shows> & {
	guests: Array<{
		guest: {
			github: string | null;
			name: string;
		};
	}>;
	hosts: Array<{
		profile: {
			id: string;
			username: string | null;
			name: string | null;
			twitter: string | null;
		};
	}>;
	aiShowNote: {
		description: string;
		topics: InferSelectModel<typeof topics>[];
	} | null;
};
