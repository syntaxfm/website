#!/usr/bin/env node
import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { createConnection } from 'mysql2/promise';

expand(dotenv.config());

const PROD_DB_URL = process.env.PROD_DATABASE_URL;
const LOCAL_DB_URL = process.env.DATABASE_URL;

async function main() {
	console.log('🔄 Restoring local database from production...\n');

	if (!PROD_DB_URL) {
		console.error('❌ ERROR: PROD_DATABASE_URL is not set in .env');
		console.error('   Add: PROD_DATABASE_URL=mysql://user:pass@host/your_prod_db');
		process.exit(1);
	}

	const prodUrl = new URL(PROD_DB_URL);
	const localUrl = new URL(LOCAL_DB_URL);

	const prodDb = prodUrl.pathname.substr(1);
	const localDb = localUrl.pathname.substr(1);

	if (localDb === prodDb && localUrl.hostname === prodUrl.hostname) {
		console.error('❌ ERROR: Local and prod databases are the same!');
		console.error('   DATABASE_URL and PROD_DATABASE_URL cannot point to the same database');
		process.exit(1);
	}

	console.log(`📦 Production DB: ${prodDb}`);
	console.log(`🎯 Local DB: ${localDb}`);
	console.log('');

	const readline = (await import('readline')).createInterface({
		input: process.stdin,
		output: process.stdout
	});

	const answer = await new Promise((resolve) => {
		readline.question('⚠️  This will OVERWRITE your local database. Continue? (yes/no): ', resolve);
	});
	readline.close();

	if (answer.toLowerCase() !== 'yes') {
		console.log('❌ Cancelled');
		process.exit(0);
	}

	// Connect to both databases with SSL
	const prodConn = await createConnection({
		uri: PROD_DB_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	const localConn = await createConnection({
		uri: LOCAL_DB_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});

	try {
		console.log('\n1️⃣ Getting table list from production...');
		const [tables] = await prodConn.execute(
			`
			SELECT TABLE_NAME
			FROM information_schema.TABLES
			WHERE TABLE_SCHEMA = ?
			ORDER BY TABLE_NAME
		`,
			[prodDb]
		);

		console.log(`   Found ${tables.length} tables\n`);

		console.log('2️⃣ Dropping local database tables...');
		await localConn.execute('SET FOREIGN_KEY_CHECKS = 0');

		for (const { TABLE_NAME } of tables) {
			try {
				await localConn.execute(`DROP TABLE IF EXISTS \`${TABLE_NAME}\``);
			} catch (e) {
				console.log(`   Warning: Could not drop ${TABLE_NAME}: ${e.message}`);
			}
		}

		await localConn.execute('SET FOREIGN_KEY_CHECKS = 1');
		console.log('   ✅ Local tables dropped\n');

		console.log('3️⃣ Copying tables from production to local...');
		console.log('   (This may take a while for large tables)\n');

		for (const { TABLE_NAME } of tables) {
			// Handle transcript tables specially - create structure but skip data
			const skipData =
				TABLE_NAME === 'TranscriptUtterance' || TABLE_NAME === 'TranscriptUtteranceWord';

			try {
				// Get CREATE TABLE statement from prod
				const [createResult] = await prodConn.execute(`SHOW CREATE TABLE \`${TABLE_NAME}\``);
				const createStatement = createResult[0]['Create Table'];

				// Create table in local
				await localConn.execute(createStatement);

				if (skipData) {
					console.log(`   ${TABLE_NAME}: Structure created (no data) ✅`);
					continue;
				}

				// Get row count
				const [countResult] = await prodConn.execute(
					`SELECT COUNT(*) as count FROM \`${TABLE_NAME}\``
				);
				const rowCount = countResult[0].count;

				if (rowCount > 0) {
					// Copy data in batches to avoid timeout
					const batchSize = 1000;
					let offset = 0;
					let totalCopied = 0;

					while (offset < rowCount) {
						const [rows] = await prodConn.execute(
							`SELECT * FROM \`${TABLE_NAME}\` LIMIT ? OFFSET ?`,
							[batchSize, offset]
						);

						if (rows.length > 0) {
							// Disable foreign key checks for faster insert
							await localConn.execute('SET FOREIGN_KEY_CHECKS = 0');

							// Build bulk insert
							const columns = Object.keys(rows[0]);
							const values = rows
								.map((row) => `(${columns.map((col) => localConn.escape(row[col])).join(',')})`)
								.join(',');

							const insertSQL = `INSERT INTO \`${TABLE_NAME}\` (\`${columns.join('`,`')}\`) VALUES ${values}`;
							await localConn.execute(insertSQL);

							await localConn.execute('SET FOREIGN_KEY_CHECKS = 1');

							totalCopied += rows.length;
							process.stdout.write(`\r   ${TABLE_NAME}: ${totalCopied}/${rowCount} rows`);
						}

						offset += batchSize;
					}
					console.log(` ✅`);
				} else {
					console.log(`   ${TABLE_NAME}: 0 rows (empty) ✅`);
				}
			} catch (error) {
				console.error(`\n   ❌ Error copying ${TABLE_NAME}: ${error.message}`);
			}
		}

		console.log('\n✨ Restoration complete!');
		console.log('');
		console.log('🎉 Your local database now has all production data');
		console.log('📋 TranscriptUtterance/TranscriptUtteranceWord tables created (empty)');
		console.log("⚠️  Remember: This is a COPY. Changes here won't affect production.");
		console.log('');
		console.log('Next steps:');
		console.log('  1. Run production migration: node scripts/rename_show_to_shows.js');
		console.log('  2. Then run: pnpm dev');
		console.log('');
	} catch (error) {
		console.error('❌ Fatal error:', error.message);
		throw error;
	} finally {
		await prodConn.end();
		await localConn.end();
	}
}

main().catch((error) => {
	console.error('❌ Error:', error.message);
	process.exit(1);
});
