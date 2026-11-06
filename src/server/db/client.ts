// PostgreSQL database client (Drizzle over postgres.js)
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getRequestEvent } from '$app/server';
import type { RequestEvent } from '@sveltejs/kit';
import * as tables from './schema';
import * as relations from './relations';
import { time_query } from '$server/server_timing';
import { POSTGRES_DATABASE_URL, DATABASE_URL } from '$app/env/private';

// Drizzle needs the table definitions and relations combined into one schema object
const schema = { ...tables, ...relations };

// Cloudflare Workers can't reuse a socket opened during one request in another request, so there
// each request gets its own connection, pooled by Hyperdrive. Node (vite dev, scripts, tests)
// keeps one shared pool.
const IS_CLOUDFLARE_WORKER =
	typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';

function connect(connection_url: string | undefined) {
	if (!connection_url) {
		throw new Error('No database: no HYPERDRIVE binding, POSTGRES_DATABASE_URL or DATABASE_URL');
	}

	const client = postgres(connection_url, {
		max: IS_CLOUDFLARE_WORKER ? 5 : 10,
		idle_timeout: 20,
		connect_timeout: 10,
		prepare: true,
		ssl: connection_url.includes('localhost') ? false : 'prefer'
	});
	// Drizzle runs every query through `unsafe`
	const unsafe = client.unsafe.bind(client);
	client.unsafe = ((...args: Parameters<typeof unsafe>) =>
		time_query(unsafe(...args))) as typeof client.unsafe;
	return drizzle(client, { schema, logger: false });
}

export type Database = ReturnType<typeof connect>;

let shared_db: Database | undefined;
const request_dbs = new WeakMap<RequestEvent, Database>();

function current_request(): RequestEvent | null {
	try {
		return getRequestEvent();
	} catch {
		// Outside a request (startup, scripts)
		return null;
	}
}

function current_db(): Database {
	const request = IS_CLOUDFLARE_WORKER ? current_request() : null;
	if (!request) return (shared_db ??= connect(POSTGRES_DATABASE_URL || DATABASE_URL));

	let request_db = request_dbs.get(request);
	if (!request_db) {
		// Hyperdrive (alchemy.run.ts) is PlanetScale's recommended path for Workers: direct
		// connections from Workers to PlanetScale time out.
		const hyperdrive = request.platform?.env.HYPERDRIVE?.connectionString;
		request_db = connect(hyperdrive || POSTGRES_DATABASE_URL || DATABASE_URL);
		request_dbs.set(request, request_db);
	}
	return request_db;
}

// The same `db` import everywhere; each property read goes to this request's connection.
export const db = new Proxy({} as Database, {
	get(_target, property) {
		const target = current_db();
		const value: unknown = Reflect.get(target, property, target);
		return typeof value === 'function' ? value.bind(target) : value;
	}
});
