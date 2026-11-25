import { resolve } from '$app/paths';
import type { Show } from '$server/db/types';

// Since episode 1014 the Monday episode is a cut of the week's live stream. Nothing in the
// database says so: a Monday episode is only known by its type, which comes from its weekday.
export const FIRST_LIVE_EPISODE_DATE = new Date('2026-06-22T00:00:00Z');

export const VIDEO_LABEL = 'Syntax Video';

export type ShowLabel = ReturnType<typeof get_show_label> | typeof VIDEO_LABEL;

// The /videos type filter (?type=) that lists everything carrying a label
const BROWSE_TYPE_BY_LABEL = {
	'Syntax Podcast': 'podcast',
	'Syntax Live': 'live',
	[VIDEO_LABEL]: 'video'
} as const satisfies Record<ShowLabel, string>;

export function get_label_browse_url(label: ShowLabel) {
	return `${resolve('videos')}?type=${BROWSE_TYPE_BY_LABEL[label]}`;
}

export type LabeledShow = {
	show_type: Show['show_type'];
	// A string once a list has been through the edge cache or JSON
	date: Date | string;
};

export function get_show_label(show: LabeledShow): 'Syntax Live' | 'Syntax Podcast' {
	const is_live_episode =
		show.show_type === 'HASTY' && new Date(show.date) >= FIRST_LIVE_EPISODE_DATE;
	return is_live_episode ? 'Syntax Live' : 'Syntax Podcast';
}
