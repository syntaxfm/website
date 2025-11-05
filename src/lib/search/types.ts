import type { Show } from '$server/db/schema';

export interface Block {
	breadcrumbs: string[];
	href: string;
	content: string;
	rank: number;
}

export interface Tree {
	breadcrumbs: string[];
	href: string;
	node: Block & Show;
	children: Tree[];
}
