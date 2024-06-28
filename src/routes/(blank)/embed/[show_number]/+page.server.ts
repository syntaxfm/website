import { error } from '@sveltejs/kit';
import { cache_mang } from '$utilities/cache_mang';
import type { Prisma, Show } from '@prisma/client';

export const load = async function ({ params, locals }) {
	const { show_number } = params;
	const query = {
		where: { number: parseInt(show_number) },
		include: {
			guests: {
				select: {
					Guest: true
				}
			},
			hosts: {
				select: {
					id: true,
					username: true,
					name: true,
					twitter: true
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
		throw error(401, `That is a show, but it's in the future! \n\nCome back ${show_date}`);
	}

	return {
		user_theme: locals.theme,
		show
	};
};
