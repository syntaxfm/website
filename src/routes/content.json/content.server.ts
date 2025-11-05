import { db } from '$server/db/client';
import { show } from '$server/db/schema';
import type { Show } from '$server/db/types';
import { lte, desc } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

interface Block {
	breadcrumbs: string[];
	content: string;
	href: string;
	number: number;
}

export async function content() {
	const blocks: (Block & Show)[] = [];
	const today = new Date();
	const showsData = await db
		.select()
		.from(show)
		.where(lte(show.date, today))
		.orderBy(desc(show.number));

	showsData.forEach((show) => {
		blocks.push({
			breadcrumbs: [show.title],
			content: show.show_notes,
			href: `/show/${show.number}/${show.slug}`,
			...show
		});
	});
	return blocks;
}
