import { get_show_detail_query } from './shows_queries';
import { prisma_client } from '$/hooks.server';
import { super_cache_mang } from '../cache/cache_mang';

// Usage examples with explicit return types
// async function get_cached_playlists(prisma: PrismaClient) {
// 	return super_cache_mang('cached_playlists', () =>
// 		prisma.playlist.findMany({
// 			orderBy: { created_at: 'desc' },
// 			select: { id: true, created_at: true }
// 		})
// 	);
// }

export async function show(show_number: number) {
	const show_query = get_show_detail_query(show_number);
	return super_cache_mang(`show:${show_number}`, () => prisma_client.show.findUnique(show_query));
}

export async function latest_shows() {
	return super_cache_mang('homepage:latest_shows', () => {});
}

// const latest: LatestShow[] = await cache_mang(
// 	`homepage:latest_shows`,
// 	locals.prisma.show.findMany,
// 	SHOW_QUERY(),
// 	cache_s
// );
