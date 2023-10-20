import { prisma_client } from '../../hooks.server';
import type { Show } from '@prisma/client';

interface Block {
	breadcrumbs: string[];
	content: string;
	href: string;
}

export async function content() {
	const blocks: (Block & Show)[] = [];
	const shows = await prisma_client.show.findMany({ orderBy: { number: 'desc' } });

	shows.forEach((show) => {
		blocks.push({
			breadcrumbs: [show.title],
			content: show.show_notes,
			href: `/shows/${show.number}/${show.slug}`,
			...show
		});
	});
	return blocks;
}
