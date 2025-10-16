import { drizzle as drizzleMysql2 } from 'drizzle-orm/mysql2';
import { drizzle as drizzlePlanetScale } from 'drizzle-orm/planetscale-serverless';
import { Client } from '@planetscale/database';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL!;

// Detect if using PlanetScale (connection string contains psdb.cloud)
const isPlanetScale = DATABASE_URL.includes('psdb.cloud');

// Create the database client - use 'as any' to bypass union type issues
// Both drivers have compatible APIs at runtime
const db = (
	isPlanetScale
		? drizzlePlanetScale(new Client({ url: DATABASE_URL }), { schema })
		: drizzleMysql2(await mysql.createConnection({ uri: DATABASE_URL }), {
				schema,
				mode: 'default'
			})
) as ReturnType<typeof drizzleMysql2<typeof schema>>;

export { db };
