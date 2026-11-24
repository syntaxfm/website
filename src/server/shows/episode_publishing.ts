import { error } from '@sveltejs/kit';
import { and, inArray, isNotNull, isNull, or } from 'drizzle-orm';

import { db } from '$server/db/client';
import { show } from '$server/db/schema';

// A draft episode may have no number and no audio yet (Syntax Buddy sends it as soon as the edit is
// done). It can't go live until it has both: every way content becomes PUBLISHED checks here.

const NEEDS_NUMBER_AND_AUDIO = 'needs an episode number and an audio URL before it can be published';

/** Refuses PUBLISHED (now or scheduled) for an episode missing its number or audio URL. */
export function assert_episode_can_publish(episode: {
	status: string;
	number: number | null | undefined;
	url: string | null | undefined;
	title?: string;
}): void {
	if (episode.status !== 'PUBLISHED') return;
	if (episode.number === null || episode.number === undefined || !episode.url?.trim()) {
		error(400, `${episode.title ? `“${episode.title}”` : 'This episode'} ${NEEDS_NUMBER_AND_AUDIO}`);
	}
}

/** The content ids of episodes that can't be published yet: no number or no audio URL. */
export function unpublishable_episode_content_ids() {
	return db
		.select({ id: show.content_id })
		.from(show)
		.where(and(isNotNull(show.content_id), or(isNull(show.number), isNull(show.url))));
}

/** Refuses publishing any of these content items whose episode lacks its number or audio URL. */
export async function assert_episodes_can_publish(content_ids: readonly string[]): Promise<void> {
	if (content_ids.length === 0) return;
	const [blocked] = await db
		.select({ title: show.title })
		.from(show)
		.where(
			and(inArray(show.content_id, [...content_ids]), or(isNull(show.number), isNull(show.url)))
		)
		.limit(1);
	if (blocked) error(400, `“${blocked.title}” ${NEEDS_NUMBER_AND_AUDIO}`);
}
