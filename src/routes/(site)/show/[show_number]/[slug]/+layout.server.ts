import { error } from '@sveltejs/kit';
import { cache_mang } from '$utilities/cache_mang';
import type { Prisma, Show } from '@prisma/client';
import { processor } from '$/utilities/markdown.js';

export const load = async function ({ params, locals, url }) {
	const { show_number } = params;
	const query = {
		where: { number: parseInt(show_number) },
		include: {
			guests: {
				select: {
					Guest: true
				}
			},
			aiShowNote: {
				include: {
					topics: true,
					links: true,
					summary: true,
					tweets: true
				}
			}
		}
	};
	type ShowTemp = Prisma.ShowGetPayload<typeof query>;

	// Caches and gets show dynamically based on release date
	const show = await cache_mang<ShowTemp & Show>(
		`show:${show_number}`,
		locals.prisma.show.findUnique,
		query,
		'SHOW'
	);

	// Check if this is a future show
	const now = new Date();
	const show_date = new Date(show?.date || '');
	const is_admin = locals?.user?.roles?.includes('admin');
	if (show_date > now && !is_admin) {
		error(401, `That is a show, but it's in the future! \n\nCome back ${show_date}`);
	}

	const body_excerpt = await processor.process(show?.show_notes || '');

	// Regular expression pattern and replacement
	const pattern = /(<h2>)(?!Show Notes<\/h2>)(.*?)(<\/h2>)/g;
	const replacement = '<h3>$2</h3>';

	const body_string = body_excerpt.toString();
	// the md has h2s in it, it's not reasonable to change all of the md,
	// so I'm making them be h3s instead
	// maybe that's a todo for another day
	const with_h3_body = body_string.replace(pattern, replacement);

	return {
		show: {
			...show,
			show_notes: with_h3_body
		} as ShowTemp & Show,
		time_start: url.searchParams.get('t') || '0',
		meta: {
			title: `${
				url.pathname.includes('/transcript') ? 'Transcript: ' : ''
			}${show?.title} - Syntax #${show_number}`,
			image: `${url.protocol}//${url.host}/og/${show_number}.jpg`,
			url: `${url.protocol}//${url.host}${url.pathname}`,
			canonical: `${url.protocol}//${url.host}${url.pathname}`,
			description: show?.aiShowNote?.description ?? show?.show_notes?.match(/(.*?)(?=## )/s)?.[0]
		}
	};
};
