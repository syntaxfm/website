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
