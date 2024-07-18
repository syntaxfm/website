import { PER_PAGE } from '$/const';
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

export function get_last_10_shows_query() {
	const today = new Date();
	const show_card_query = get_show_card_query();
	return Prisma.validator<Prisma.ShowFindManyArgs>()({
		take: take_homepage,
		orderBy: { number: 'desc' },
		where: {
			date: { lte: today }
		},
		...show_card_query
	});
}
export type ShowLast10 = Prisma.ShowGetPayload<ReturnType<typeof get_last_10_shows_query>>;

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
