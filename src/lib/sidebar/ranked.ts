import type { Pathname } from '$app/types';

export type RankedContent = {
	id: string;
	title: string;
	href: Pathname;
	series: string;
	number: number | null;
	thumbnail: string | null;
	date: Date;
	people: string[];
};
