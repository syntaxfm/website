#!/usr/bin/env node
import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import semver from 'semver';
import { drizzle } from 'drizzle-orm/mysql2';
import { mysqlTable, varchar, datetime, int } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// Load environment variables
expand(dotenv.config());

// Define minimal user schema for this script
// This is just here so that Node won't get mad. We could make this in TS if we want later and run via tsx or something. I just didn't want to add another dep.
const users = mysqlTable('User', {
	id: varchar('id', { length: 191 }).primaryKey(),
	avatar_url: varchar('avatar_url', { length: 255 }),
	created_at: datetime('created_at').notNull().default(new Date()),
	email: varchar('email', { length: 191 }),
	github_id: int('github_id').notNull().unique(),
	updated_at: datetime('updated_at').notNull(),
	username: varchar('username', { length: 191 }),
	theme: varchar('theme', { length: 50 }).notNull().default('system'),
	name: varchar('name', { length: 191 }),
	twitter: varchar('twitter', { length: 191 })
});

async function main() {
	const args = process.argv.slice(2);
	const envOnly = args.includes('--env-only');

	try {
		if (envOnly) {
			await checkAndUpdateEnv();
			execSync('pnpm install', { stdio: 'inherit' });
			console.log('🥘 Website preheated to 450°F (232°C)');
			return;
		}

		await checkPnpmVersion();
		await checkAndUpdateEnv();
		checkDatabaseUrl();
		await ensureDrizzleMigrationSetup();
		await createUpdateSchema();
		await checkShowTableData();
		console.log('🥘 Website preheated to 450°F (232°C)');
		execSync('pnpm vite dev', { stdio: 'inherit' });
	} catch (error) {
		console.error('Error:', error.message);
		process.exit(1);
	}
}

async function checkPnpmVersion() {
	const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
	const requiredVersion = packageJson.engines.pnpm;
	const installedVersion = execSync('pnpm --version').toString().trim();

	if (!semver.satisfies(installedVersion, requiredVersion)) {
		throw new Error(`❌ Please install pnpm version ${requiredVersion} or newer before proceeding`);
	}
	console.log('✅ pnpm Check');
}

async function checkAndUpdateEnv() {
	const envPath = '.env';
	const exampleEnvPath = '.env.example';

	try {
		await fs.access(envPath);
	} catch {
		await fs.copyFile(exampleEnvPath, envPath);
		console.log('🤝 .env.example copied to .env');

		const mysqlQuery = await promptForMysqlQuery();
		let envContent = await fs.readFile(envPath, 'utf8');
		envContent = envContent.replace(
			"DATABASE_URL='REQUIRED__YOU_NEED_A_MYSQL_URL'",
			`DATABASE_URL='${mysqlQuery}'`
		);
		await fs.writeFile(envPath, envContent);
		console.log('✅ Updated DATABASE_URL in .env');
	}

	const envVars = dotenv.parse(await fs.readFile(envPath));
	const exampleEnvVars = dotenv.parse(await fs.readFile(exampleEnvPath));

	const missingVars = Object.keys(exampleEnvVars).filter((key) => !(key in envVars));

	if (missingVars.length > 0) {
		const appendContent = missingVars.map((key) => `${key}=${exampleEnvVars[key]}`).join('\n');
		await fs.appendFile(envPath, '\n' + appendContent);
		console.log('✅ Added missing variables to .env');
	}

	console.log('✅ .env');
}

async function promptForMysqlQuery() {
	const readline = (await import('readline')).createInterface({
		input: process.stdin,
		output: process.stdout
	});

	return new Promise((resolve) => {
		readline.question('Please enter the MySQL query string: ', (answer) => {
			readline.close();
			resolve(answer.trim());
		});
	});
}

function checkDatabaseUrl() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl || !databaseUrl.startsWith('mysql://')) {
		throw new Error('❌ Please set DATABASE_URL in .env to be a proper mysql url');
	}
	console.log('✅ DATABASE_URL Check');
}

async function ensureDrizzleMigrationSetup() {
	const connection = await createMysqlConnection();
	try {
		// Check if __drizzle_migrations table exists
		const [tables] = await connection.execute(`
			SELECT TABLE_NAME
			FROM information_schema.TABLES
			WHERE TABLE_SCHEMA = DATABASE()
			AND TABLE_NAME = '__drizzle_migrations'
		`);

		if (tables.length === 0) {
			// Table doesn't exist, create it
			console.log('🔧 Setting up Drizzle migrations...');
			await connection.execute(`
				CREATE TABLE \`__drizzle_migrations\` (
					\`id\` SERIAL PRIMARY KEY,
					\`hash\` text NOT NULL,
					\`created_at\` bigint
				)
			`);
			console.log('✅ Created __drizzle_migrations table');
		}

		// Check if initial migration is marked as applied
		const [migrations] = await connection.execute(`
			SELECT * FROM \`__drizzle_migrations\`
			WHERE \`hash\` = '0000_graceful_shaman'
		`);

		if (migrations.length === 0) {
			// Mark initial migration as applied (Prisma -> Drizzle transition)
			console.log('�� Marking initial migration as applied (Prisma → Drizzle transition)...');
			await connection.execute(`
				INSERT INTO \`__drizzle_migrations\` (\`hash\`, \`created_at\`)
				VALUES ('0000_graceful_shaman', UNIX_TIMESTAMP() * 1000)
			`);
			console.log('✅ Initial migration marked as applied');
		} else {
			console.log('✅ Drizzle migrations');
		}
	} catch (error) {
		throw new Error(`❌ Failed to set up Drizzle migrations: ${error.message}`);
	} finally {
		await connection.end();
	}
}

async function createUpdateSchema() {
	const connection = await createMysqlConnection();
	try {
		// Check if Shows table exists (main indicator that schema is set up)
		const [tables] = await connection.execute(`
			SELECT TABLE_NAME
			FROM information_schema.TABLES
			WHERE TABLE_SCHEMA = DATABASE()
			AND TABLE_NAME = 'Show'
		`);

		if (tables.length > 0) {
			console.log('✅ Database schema exists');
			return;
		}

		// No schema found - need to restore from production first
		console.log('❌ No database schema found!');
		console.log('   Run: node scripts/restore_from_prod.js');
		process.exit(1);
	} catch (error) {
		throw new Error(`❌ Unable to verify DB schema: ${error.message}`);
	} finally {
		await connection.end();
	}
}

async function createHostUsers() {
	const connection = await createMysqlConnection();
	const db = drizzle(connection);

	try {
		const hosts = [
			{
				username: 'wesbos',
				name: 'Wes Bos',
				github_id: 176013,
				avatar_url: 'https://avatars.githubusercontent.com/u/176013?v=4',
				email: 'wes@wesbos.com',
				twitter: 'wesbos'
			},
			{
				username: 'stolinski',
				name: 'Scott Tolinski',
				github_id: 669383,
				avatar_url: 'https://avatars.githubusercontent.com/u/669383?v=4',
				email: 'scott.tolinski@gmail.com',
				twitter: 'stolinski'
			},
			{
				username: 'w3cj',
				name: 'CJ',
				github_id: 14241866,
				avatar_url: 'https://avatars.githubusercontent.com/u/14241866?v=4',
				email: 'cj@null.computer',
				twitter: 'CodingGarden'
			}
		];

		for (const host of hosts) {
			await db
				.insert(users)
				.values({
					id: `user_${host.username}`,
					username: host.username,
					name: host.name,
					github_id: host.github_id,
					avatar_url: host.avatar_url,
					email: host.email,
					twitter: host.twitter,
					updated_at: new Date()
				})
				.onDuplicateKeyUpdate({
					set: {
						username: host.username,
						name: host.name,
						avatar_url: host.avatar_url,
						email: host.email,
						twitter: host.twitter,
						updated_at: new Date()
					}
				});
		}
		console.log('✅ Host users created/updated');
	} catch (error) {
		console.error('❌ Error creating host users:', error);
	} finally {
		await connection.end();
	}
}

async function checkShowTableData() {
	const connection = await createMysqlConnection();
	try {
		// Check both possible table names
		let count = 0;
		try {
			const [showsRows] = await connection.execute('SELECT COUNT(*) as count FROM `Show`');
			count = showsRows[0].count;
			console.log(`[DEBUG] Show table count: ${count}`);
		} catch (e) {
			console.log(`[DEBUG] Show table query failed:`, e.message);
		}

		if (count === 0) {
			try {
				const [showRows] = await connection.execute('SELECT COUNT(*) as count FROM `Show`');
				count = showRows[0].count;
				console.log(`[DEBUG] Show table count: ${count}`);
			} catch (e) {
				console.log(`[DEBUG] Show table query failed:`, e.message);
			}
		}

		if (count > 0) {
			console.log('✅ Data Check');
		} else {
			console.log('❌ Data Check - Seeding database...');
			await seedDatabase();
			console.log('✅ Database seeded');
		}

		// Always ensure host users exist
		await createHostUsers();
	} finally {
		await connection.end();
	}
}

async function seedDatabase() {
	const seedFilePath = './seed/seed.sql';
	try {
		const seedContent = await fs.readFile(seedFilePath, 'utf8');
		const connection = await createMysqlConnection();
		try {
			// Disable foreign key checks for seeding
			await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
			await connection.query(seedContent);
			await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
		} finally {
			await connection.end();
		}
	} catch (error) {
		if (error.code === 'ENOENT') {
			console.log('⚠️  No seed file found at ./seed/seed.sql - skipping seed');
		} else if (error.code === 'ER_DUP_ENTRY') {
			console.log('⚠️  Some seed data already exists - skipping');
		} else {
			throw error;
		}
	}
}

async function createMysqlConnection() {
	const url = new URL(process?.env?.DATABASE_URL);
	return await createConnection({
		host: url.hostname,
		port: parseInt(url.port),
		user: url.username,
		password: url.password,
		database: url.pathname.substr(1),
		multipleStatements: true
	});
}

main();
