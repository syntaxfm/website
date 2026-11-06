// PostgreSQL database client (Drizzle over postgres.js)
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getRequestEvent } from '$app/server';
import * as tables from './schema';
import * as relations from './relations';
import { POSTGRES_DATABASE_URL, DATABASE_URL } from '$app/env/private';

// Drizzle needs the table definitions and relations combined into one schema object
const schema = { ...tables, ...relations };

// Cloudflare Workers can't reuse a socket opened during one request in another request, so there
// each request gets its own connection (production pools them through Hyperdrive). Node (vite dev,
// scripts, tests) keeps one shared pool.
const IS_CLOUDFLARE_WORKER =
	typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';

function connect() {
	const connection_url = POSTGRES_DATABASE_URL || DATABASE_URL;
	if (!connection_url) {
		throw new Error('POSTGRES_DATABASE_URL or DATABASE_URL must be set');
	}

	const client = postgres(connection_url, {
		max: IS_CLOUDFLARE_WORKER ? 5 : 10,
		idle_timeout: 20,
		connect_timeout: 10,
		prepare: true,
		ssl: connection_url.includes('localhost') ? false : 'prefer'
	});
	return drizzle(client, { schema, logger: false });
}

export type Database = ReturnType<typeof connect>;

let shared_db: Database | undefined;
const request_dbs = new WeakMap<object, Database>();

function current_request(): object | null {
	try {
		return getRequestEvent();
	} catch {
		// Outside a request (startup, scripts)
		return null;
	}
}

function current_db(): Database {
	const request = IS_CLOUDFLARE_WORKER ? current_request() : null;
	if (!request) return (shared_db ??= connect());

	let request_db = request_dbs.get(request);
	if (!request_db) {
		request_db = connect();
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
