import { Prisma, type Show } from '@prisma/client';
import { cache_status, redis } from '$/hooks.server';
import { get_show_cache_s } from '../../utilities/get_show_cache_ms';
import type { DMMF } from '@prisma/client/runtime/library';

// Function to get DateTime field names from all Prisma models
// This lets us know which date time fields need to be converted to JS Date objects from the cache without guessing.
function get_all_date_time_fields() {
	const dmmf = Prisma.dmmf as DMMF.Document;
	const fields = new Set<string>();
	dmmf.datamodel.models.forEach((model) => {
		model.fields.filter((f) => {
			if (f.type === 'DateTime') {
				fields.add(f.name);
			}
		});
	});
	return fields;
}

const date_time_fields = get_all_date_time_fields();

export async function super_cache_mang<T>(
	cache_key: string,
	db_call: () => Promise<T>
): Promise<T> {
	if (cache_status !== 'ONLINE' || !redis) {
		return db_call();
	}

	const cache_string = await redis.get<string>(cache_key).catch(() => null);

	if (cache_string) {
		return JSON.parse(cache_string, (key, value) => {
			if (date_time_fields.has(key)) {
				return new Date(value);
			}
			return value;
		}) as T;
	}

	const data = await db_call();

	if (data) {
		let expiration_time = 3600; // Default to 1 hour for lists and non-show models
		if (cache_key.startsWith('show:') && !Array.isArray(data)) {
			const show = data as unknown as Show;
			expiration_time = get_show_cache_s(show.date);
		}
		await redis.set(cache_key, data, { ex: expiration_time });
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
