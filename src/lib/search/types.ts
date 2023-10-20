import type { Show } from '@prisma/client';

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
