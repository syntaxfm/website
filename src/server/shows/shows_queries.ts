import { PER_PAGE } from '$/const';
import type { Prisma } from '@prisma/client';

const take_homepage = PER_PAGE;
const take_listing = PER_PAGE;

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

export function last_10_shows(): Prisma.ShowFindManyArgs {
	const today = new Date();
	return {
		take: take_homepage,
		orderBy: { number: 'desc' },
		where: {
			date: { lte: today }
		},
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
	};
}

export function get_show_detail_query(number: number): Prisma.ShowFindUniqueArgs {
	return {
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
	};
}
