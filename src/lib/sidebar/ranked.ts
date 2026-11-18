import type { Path } from '$app/types';

export type RankedContent = {
	id: string;
	title: string;
	href: Path;
	series: string;
	number: number | null;
	thumbnail: string | null;
	// Smaller sizes of the same thumbnail, when it is a YouTube video
	thumbnail_srcset: string | null;
	// ISO date: the list is edge cached as JSON
	date: string;
	people: string[];
};

export const POPULAR_COUNT = 5;

/** The Most Popular items a page shows: without the episode being viewed, which can't rank itself. */
export function get_shown_popular(
	items: RankedContent[],
	viewed_show_number: string | undefined
): RankedContent[] {
	return items.filter((item) => String(item.number) !== viewed_show_number).slice(0, POPULAR_COUNT);
}
