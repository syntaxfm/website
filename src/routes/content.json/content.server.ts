import { format_show_type } from '$utilities/format_show_type';
import { prisma_client } from '../../hooks.server';

export async function content() {
	const blocks = [];
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
