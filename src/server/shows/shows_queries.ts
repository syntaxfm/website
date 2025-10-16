import { asc, desc } from 'drizzle-orm';

import { PER_PAGE } from '$/const';
import { db } from '$/db/client';
import { shows } from '$/db/schema';
import { $Enums, Prisma } from '@prisma/client';

const take_homepage = PER_PAGE;

function isShowType(type: string | null | undefined): type is $Enums.ShowType {
	if (!type) return false;
	return Object.prototype.hasOwnProperty.call($Enums.ShowType, type);
}

const hosts = {
	select: {
		id: true,
		username: true,
		name: true,
		twitter: true
	}
};

const guests = {
	select: {
		Guest: true
	}
};

// Need a show card? this is your query
export function get_show_card_query() {
	return Prisma.validator<Prisma.ShowFindManyArgs>()({
		include: {
			guests,
			hosts,
			aiShowNote: {
				select: {
					description: true,
					topics: true
				}
			}
		}
	});
}
export type ShowCard = Prisma.ShowGetPayload<ReturnType<typeof get_show_card_query>>;

// A list of show cards, for the /shows page
export function get_list_shows(
	page: number,
	take: number,
	order: 'desc' | 'asc',
	show_type: string | undefined
) {
	const today = new Date();
	const parsed_show_type = isShowType(show_type) ? show_type : undefined;
	// The query needed for Show Cards to be complete
	const show_card_query = get_show_card_query();
	return Prisma.validator<Prisma.ShowFindManyArgs>()({
		take,
		skip: page ? page * take - take : 0,
		orderBy: { number: order },
		where: {
			...(parsed_show_type && { show_type: parsed_show_type }),
			date: { lte: today }
		},
		...show_card_query
	});
}
export type ShowList = Prisma.ShowGetPayload<ReturnType<typeof get_list_shows>>;

export async function get_last_10_shows() {
	const last_10 = await db.query.shows.findMany({
		limit: 10,
		orderBy: [desc(shows.number)],
		where: (show, { lte }) => lte(show.date, new Date()),
		with: {
			guests: true,
			hosts: true,
			aiShowNote: {
				columns: {
					description: true
				},
				with: {
					topics: true
				}
			}
		}
	});
	return last_10;
}

export function get_show_detail_query(number: number) {
	return Prisma.validator<Prisma.ShowFindUniqueArgs>()({
		where: { number },
		include: {
			guests,
			videos: {
				include: {
					video: {
						include: {
							playlists: {
								include: {
									playlist: true
								}
							}
						}
					}
				}
			},
			hosts,
			aiShowNote: {
				include: {
					topics: true,
					links: true,
					summary: true,
					tweets: true
				}
			}
		}
	});
}

export type ShowDetail = Prisma.ShowGetPayload<ReturnType<typeof get_show_detail_query>>;
