import type { QueryInputs } from '$server/ai/queries';
import type { Prisma } from '@prisma/client';
import { redis } from '../hooks.server';
// Eyyyy it's the cache mang, coming to cache this ish up.
// Nobody likes a stale cache

export async function cache_mang<T>(
	cache_key: string,
	db_call: Prisma.ShowDelegate['findMany'],
	db_query: QueryInputs,
	seconds_to_expire: number
) {
	let temp;
	const temp_cached = await redis.get<T>(cache_key).catch();

	if (temp_cached) {
		return temp_cached.map(convert_dates);
	} else {
		temp = await db_call(db_query);
		if (temp) {
			redis.set(cache_key, temp, {
				ex: seconds_to_expire
			});
		}
	}
	return temp;
}

const is_date_like_string = (value: any): value is string => {
	return (
		typeof value === 'string' &&
		(value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/) || // ISO string with milliseconds
			value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)) // ISO string without milliseconds
	);
};

const convert_dates = (data: any): any => {
	// If it's an array, convert each element
	if (Array.isArray(data)) {
		return data.map(convert_dates);
	}
	// If it's an object, convert each property
	else if (data !== null && typeof data === 'object') {
		return Object.fromEntries(
			Object.entries(data).map(([key, value]) => [
				key,
				is_date_like_string(value) ? new Date(value) : convert_dates(value)
			])
		);
	}
	// If it's neither, return it as is
	return data;
};
