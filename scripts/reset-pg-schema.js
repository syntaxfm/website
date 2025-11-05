#!/usr/bin/env node
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import postgres from 'postgres';

expand(dotenv.config());

const POSTGRES_URL = process.env.POSTGRES_DATABASE_URL;

if (!POSTGRES_URL) {
	console.error('❌ ERROR: POSTGRES_DATABASE_URL is not set');
	process.exit(1);
}

const sql = postgres(POSTGRES_URL, {
	max: 1,
	ssl: POSTGRES_URL.includes('localhost') ? false : 'prefer'
});

async function resetSchema() {
	try {
		console.log('🗑️  Dropping public schema...');
		await sql`DROP SCHEMA public CASCADE`;
		console.log('✅ Schema dropped');

		console.log('🔨 Creating public schema...');
		await sql`CREATE SCHEMA public`;
		console.log('✅ Schema created');

		console.log('\n✨ PostgreSQL schema reset complete!');
		console.log('👉 Run: pnpm db:pg:push to recreate tables\n');
	} catch (error) {
		console.error('❌ Error:', error.message);
		throw error;
	} finally {
		await sql.end();
	}
}

resetSchema().catch(() => process.exit(1));
