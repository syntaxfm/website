// PostgreSQL database client with connection pooling
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schemas';
import { env } from '$env/dynamic/private';

// Connection string from environment
const DATABASE_URL = env.POSTGRES_DATABASE_URL || env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error('POSTGRES_DATABASE_URL or DATABASE_URL must be set');
}

// Create postgres client with connection pooling
// For production, use max: 10-20 connections
// For serverless, use max: 1-5 connections
const client = postgres(DATABASE_URL, {
	// Max number of connections in pool
	max: 10,
	// Idle timeout in seconds
	idle_timeout: 20,
	// Connection timeout in seconds
	connect_timeout: 10,
	// Enable prepared statements for better performance
	prepare: true,
	// SSL configuration (automatically enabled for most cloud providers)
	ssl: DATABASE_URL.includes('localhost') ? false : 'prefer',
	// Transform column names from snake_case to camelCase (optional)
	// transform: postgres.camel,
	// Enable debug logging in development
	debug: env.NODE_ENV === 'development' ? false : false
});

// Create drizzle instance with schema
export const db = drizzle(client, {
	schema,
	// Use 'query' strategy for better compatibility
	// 'join' strategy uses LATERAL joins which can be faster but less compatible
	// relationLoadStrategy: 'query'
	logger: false
});

// Type exports for convenience
export type Database = typeof db;
export { schema };

// Graceful shutdown helper
export async function closeDatabase() {
	await client.end();
}

// Health check helper
export async function checkDatabaseHealth() {
	try {
		await client`SELECT 1`;
		return true;
	} catch (error) {
		console.error('Database health check failed:', error);
		return false;
	}
}
