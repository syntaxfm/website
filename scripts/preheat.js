#!/usr/bin/env node

import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import semver from 'semver';
import { PrismaClient } from '@prisma/client';

// Load environment variables
expand(dotenv.config());

async function main() {
	const args = process.argv.slice(2);
	const env_only = args.includes('--env-only');

	try {
		if (env_only) {
			await checkAndUpdateEnv();
			execSync('pnpm install', { stdio: 'inherit' });
			console.log('🥘 Website preheated to 450°F (232°C)');
			return;
		}

		await checkPnpmVersion();
		await checkAndUpdateEnv();
		checkDatabaseUrl();
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
	const package_json = JSON.parse(await fs.readFile('package.json', 'utf8'));
	const required_version = package_json.engines.pnpm;
	const installed_version = execSync('pnpm --version').toString().trim();

	if (!semver.satisfies(installed_version, required_version)) {
		throw new Error(
			`❌ Please install pnpm version ${required_version} or newer before proceeding`
		);
	}
	console.log('✅ pnpm Check');
}

async function checkAndUpdateEnv() {
	const env_path = '.env';
	const example_env_path = '.env.example';

	try {
		await fs.access(env_path);
	} catch {
		await fs.copyFile(example_env_path, env_path);
		console.log('🤝 .env.example copied to .env');

		const mysql_query = await promptForMysqlQuery();
		let env_content = await fs.readFile(env_path, 'utf8');
		env_content = env_content.replace(
			"DATABASE_URL='REQUIRED__YOU_NEED_A_MYSQL_URL'",
			`DATABASE_URL='${mysql_query}'`
		);
		await fs.writeFile(env_path, env_content);
		console.log('✅ Updated DATABASE_URL in .env');
	}

	const env_vars = dotenv.parse(await fs.readFile(env_path));
	const example_env_vars = dotenv.parse(await fs.readFile(example_env_path));

	const missing_vars = Object.keys(example_env_vars).filter((key) => !(key in env_vars));

	if (missing_vars.length > 0) {
		const append_content = missing_vars.map((key) => `${key}=${example_env_vars[key]}`).join('\n');
		await fs.appendFile(env_path, '\n' + append_content);
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
	const database_url = process.env.DATABASE_URL;
	if (!database_url || !database_url.startsWith('mysql://')) {
		throw new Error('❌ Please set DATABASE_URL in .env to be a proper mysql url');
	}
	console.log('✅ DATABASE_URL Check');
}

async function createUpdateSchema() {
	try {
		execSync('pnpm db:push', { stdio: 'inherit' });
		console.log('✅ Database schema created / updated');
	} catch {
		throw new Error('❌ Unable to create / update DB schema');
	}
}

async function createHostUsers() {
	const prisma = new PrismaClient();

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
			await prisma.user.upsert({
				where: { github_id: host.github_id },
				update: {
					username: host.username,
					name: host.name,
					avatar_url: host.avatar_url,
					email: host.email,
					twitter: host.twitter
				},
				create: {
					id: `user_${host.username}`,
					username: host.username,
					name: host.name,
					github_id: host.github_id,
					avatar_url: host.avatar_url,
					email: host.email,
					twitter: host.twitter
				}
			});
		}
		console.log('✅ Host users created/updated');
	} catch (error) {
		console.error('❌ Error creating host users:', error);
	} finally {
		await prisma.$disconnect();
	}
}

async function checkShowTableData() {
	const connection = await createMysqlConnection();
	try {
		execSync('pnpm i-changed-the-schema', { stdio: 'inherit' });
		console.log('✅ Schema updated');

		const [rows] = await connection.execute('SELECT COUNT(*) as count FROM `Show`');
		const count = rows[0].count;

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
	const seed_file_path = './seed/seed.sql';
	const seed_content = await fs.readFile(seed_file_path, 'utf8');
	const connection = await createMysqlConnection();
	try {
		await connection.query(seed_content);
	} finally {
		await connection.end();
	}
}

async function createMysqlConnection() {
	const url = new URL(process.env.DATABASE_URL);
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
