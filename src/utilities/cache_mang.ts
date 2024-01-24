import type { Prisma } from '@prisma/client';
import { cache_status, redis } from '../hooks.server';
import { get_show_cache_s } from './get_show_cache_ms';
// Eyyyy it's the cache mang, coming to cache this ish up.
// Nobody likes a stale cache

// Cache mange makes sense to use for the heaviest queries on the site or when we need xtreme perf
// Example usage:
// const show = await cache_mang<ShowTemp & Show>(
// 	`show:${show_number}`, // The key for the cache, something unique
// 	locals.prisma.show.findUnique, // The db call function itself
// 	query, // The query of the call
// 	'SHOW' // ms time for non dynamic caching, or SHOW to cache an individual show based on it's release date
// );
// Some of the TS here is rough and I'm very sorry for that. - Scott

// Good luck if you would like to fix this
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaFindMethod = (args: any) => Promise<any>;

export async function cache_mang<T>(
	cache_key: string,
	db_call: PrismaFindMethod,
	db_query: Prisma.ShowFindManyArgs,
	to_expire: number | 'SHOW' = 600 //default cache time
): Promise<T> {
	let ex: number;
	let temp;

	// If the cache is ready or not
	if (cache_status === 'ONLINE' && redis) {
		const temp_cached = await redis.get<T>(cache_key).catch();

		if (temp_cached) {
			return convert_dates<T>(temp_cached);
		} else {
			temp = await db_call(db_query);
			//  If you set to_expire to type of SHOW, adjust cache between 300 and 6000 seconds based on release date
			if (to_expire === 'SHOW') {
				ex = get_show_cache_s(temp.date);
			} else {
				ex = to_expire;
			}

			if (temp) {
				redis.set(cache_key, temp, {
					ex
				});
			}
		}
		return temp;
	} else {
		return db_call(db_query);
	}
}

const is_date_like_string = (value: unknown): value is string => {
	return (
		typeof value === 'string' &&
		Boolean(
			value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/) || // ISO string with milliseconds
				value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
		) // ISO string without milliseconds
	);
};

const convert_dates = <T>(data: unknown): T => {
	// If it's an array, convert each element
	if (Array.isArray(data)) {
		return data.map(convert_dates) as T;
	}
	// If it's an object, convert each property
	else if (data !== null && typeof data === 'object') {
		return Object.fromEntries(
			Object.entries(data).map(([key, value]) => [
				key,
				is_date_like_string(value) ? new Date(value) : convert_dates(value)
			])
		) as T;
	}
	// If it's neither, return it as is
	return data as T;
};
