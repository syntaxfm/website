export type RankedContent = {
	id: string;
	title: string;
	href: string;
	series: string;
	number: number | null;
	thumbnail: string | null;
	date: Date;
	people: string[];
};
