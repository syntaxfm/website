import { prisma_client } from '$/server/prisma-client';
import type { Show } from '@prisma/client';

interface Block {
	breadcrumbs: string[];
	content: string;
	href: string;
}

export async function content() {
	const blocks: (Block & Show)[] = [];
	const today = new Date();
	const shows = await prisma_client.show.findMany({
		where: {
			date: {
				lte: today
			}
		},
		orderBy: { number: 'desc' }
	});

	shows.forEach((show) => {
		blocks.push({
			breadcrumbs: [show.title],
			content: show.show_notes,
			href: `/show/${show.number}/${show.slug}`,
			...show
		});
	});
	return blocks;
}
