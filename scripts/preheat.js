#!/usr/bin/env node

import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import semver from 'semver';

// Load environment variables
expand(dotenv.config());

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

async function createUpdateSchema() {
	try {
		execSync('pnpm db:push', { stdio: 'inherit' });
		console.log('✅ Database schema created / updated');
	} catch {
		throw new Error('❌ Unable to create / update DB schema');
	}
}

async function checkShowTableData() {
	const connection = await createMysqlConnection();
	try {
		const [rows] = await connection.execute('SELECT COUNT(*) as count FROM `Show`');
		const count = rows[0].count;

		if (count > 0) {
			console.log('✅ Data Check');
		} else {
			console.log('❌ Data Check - Seeding database...');
			await seedDatabase();
			console.log('✅ Database seeded');
			execSync('pnpm i-changed-the-schema', { stdio: 'inherit' });
			console.log('✅ Schema change command executed');
		}
	} finally {
		await connection.end();
	}
}

async function seedDatabase() {
	const seedFilePath = './seed/seed.sql';
	const seedContent = await fs.readFile(seedFilePath, 'utf8');

	const connection = await createMysqlConnection();
	try {
		const queries = seedContent.split(';').filter((query) => query.trim() !== '');
		for (const query of queries) {
			await connection.execute(query);
		}
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
		database: url.pathname.substr(1)
	});
}

main();
