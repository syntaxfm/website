import { get_show_detail_query, get_last_10_shows_query, get_list_shows } from './shows_queries';
import { prisma_client } from '$/server/prisma-client';
import { delete_keys_by_prefix, super_cache_mang } from '../cache/cache_mang';

export async function show(show_number: number) {
	const show_query = get_show_detail_query(show_number);
	return super_cache_mang(`show:${show_number}`, () => prisma_client.show.findUnique(show_query));
}

export function drop_show_cache(show_number: number) {
	return redis?.del(`show:${show_number}`);
}
export function drop_shows_list_cache() {
	redis?.del('latest_shows');
	redis?.del('shows_count');
	delete_keys_by_prefix('shows:');
}

// Grabs the cached or new data for the last 10 shows;
export async function latest_shows() {
	const shows_query = get_last_10_shows_query();
	return super_cache_mang('latest_shows', () => prisma_client.show.findMany(shows_query));
}

export async function list_shows(
	page_number: number,
	take: number,
	order: 'desc' | 'asc',
	show_type: string | undefined
) {
	const shows_query = get_list_shows(page_number, take, order, show_type);
	return super_cache_mang(
		`shows:${page_number}:${take}:${order}:${show_type ? show_type : 'all'}`,
		() => prisma_client.show.findMany(shows_query)
	);
}

export function count_shows() {
	const today = new Date();
	return super_cache_mang('shows_count', () =>
		prisma_client.show.count({
			where: {
				date: {
					lte: today
				}
			}
		})
	);
}
