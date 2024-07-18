import { Prisma } from '@prisma/client';
import { cache_status, redis } from '$/hooks.server';
import { get_show_cache_s } from '../../utilities/get_show_cache_ms';
import type { DMMF } from '@prisma/client/runtime/library';

// Function to get DateTime field names from all Prisma models
// This lets us know which date time fields need to be converted to JS Date objects from the cache without guessing.
function get_all_date_time_fields(): Record<string, string[]> {
	const dmmf = Prisma.dmmf as DMMF.Document;
	return dmmf.datamodel.models.reduce((acc: Record<string, string[]>, model) => {
		acc[model.name] = model.fields.filter((f) => f.type === 'DateTime').map((f) => f.name);
		return acc;
	}, {});
}

const date_time_fields = get_all_date_time_fields();

export async function super_cache_mang<T>(
	cache_key: string,
	db_call: () => Promise<T>
): Promise<T> {
	if (cache_status !== 'ONLINE' || !redis) {
		return db_call();
	}

	const cached_data = await redis.get<T>(cache_key).catch(() => null);

	if (cached_data) {
		return convert_dates(cached_data, Object.values(date_time_fields).flat());
	}

	const data = await db_call();

	if (data) {
		const is_show_item = cache_key.startsWith('show:');
		const expiration_time =
			is_show_item && !Array.isArray(data) ? get_show_cache_s((data as any).date) : 3600; // Default to 1 hour for lists and non-show models
		await redis.set(cache_key, data, { ex: expiration_time });
	}

	return data;
}

function convert_dates<T>(data: T, date_fields: string[]): T {
	if (Array.isArray(data)) {
		return data.map((item) => convert_dates(item, date_fields)) as T;
	} else if (data !== null && typeof data === 'object') {
		const converted_data: Record<string, any> = {};
		for (const [key, value] of Object.entries(data)) {
			if (date_fields.includes(key) && typeof value === 'string') {
				converted_data[key] = new Date(value);
			} else if (typeof value === 'object') {
				converted_data[key] = convert_dates(value, date_fields);
			} else {
				converted_data[key] = value;
			}
		}
		return converted_data as T;
	}
	return data;
}

export async function delete_keys_by_prefix(prefix: string): Promise<number> {
	let cursor = 0;
	let deleted_count = 0;

	do {
		// Scan for keys with the given prefix
		const scan_result = await redis?.scan(cursor, {
			match: `${prefix}*`
		});

		// Ensure scan_result is defined and has the expected structure
		if (!scan_result || !Array.isArray(scan_result) || scan_result.length !== 2) {
			throw new Error('Unexpected scan result structure');
		}

		const [next_cursor, keys] = scan_result;

		cursor = typeof next_cursor === 'string' ? parseInt(next_cursor) : next_cursor;

		if (Array.isArray(keys) && keys.length > 0) {
			// Delete the found keys
			const delete_count = await redis?.del(...keys);
			deleted_count += typeof delete_count === 'number' ? delete_count : 0;
			console.log('Deleted keys:', ...keys);
		}
	} while (cursor !== 0);

	return deleted_count;
}
