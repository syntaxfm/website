// src/db/client.ts — force batched “query” strategy (no LATERAL/JSON_ARRAYAGG)
import { drizzle as drizzle_mysql2 } from 'drizzle-orm/mysql2';
import { drizzle as drizzle_ps } from 'drizzle-orm/planetscale-serverless';
import { Client as PsClient } from '@planetscale/database';
import mysql from 'mysql2/promise';
import * as schema from './schemas.js';
import { env } from '$env/dynamic/private';

const db_url = env.DATABASE_URL!;
const is_planetscale =
	/mysql\+ps:\/\//i.test(db_url) ||
	/^https:\/\/.+\.psdb\.cloud/i.test(db_url) ||
	/\.psdb\.cloud/i.test(db_url);

// ✅ key change: relationLoadStrategy: 'query' avoids LATERAL/JSON_ARRAYAGG on MySQL 8.0.33
export const db = await (async () => {
	if (is_planetscale) {
		const client = new PsClient({ url: db_url });
		return drizzle_ps(client, {
			schema,
			relationLoadStrategy: 'query'
		});
	}
	const conn = await mysql.createConnection({ uri: db_url });
	return drizzle_mysql2(conn, {
		schema,
		mode: 'planetscale',
		relationLoadStrategy: 'query'
	});
})();
