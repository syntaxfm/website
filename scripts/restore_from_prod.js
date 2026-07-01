#!/usr/bin/env node
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

	const prod_url = new URL(PROD_DB_URL);
	const local_url = new URL(LOCAL_DB_URL);

	const prod_db = prod_url.pathname.substr(1);
	const local_db = local_url.pathname.substr(1);

	if (local_db === prod_db && local_url.hostname === prod_url.hostname) {
		console.error('❌ ERROR: Local and prod databases are the same!');
		console.error('   DATABASE_URL and PROD_DATABASE_URL cannot point to the same database');
		process.exit(1);
	}

	console.log(`📦 Production DB: ${prod_db}`);
	console.log(`🎯 Local DB: ${local_db}`);
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
	const prod_conn = await createConnection({
		uri: PROD_DB_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	const local_conn = await createConnection({
		uri: LOCAL_DB_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});

	try {
		console.log('\n1️⃣ Getting table list from production...');
		const [tables] = await prod_conn.execute(
			`
			SELECT TABLE_NAME
			FROM information_schema.TABLES
			WHERE TABLE_SCHEMA = ?
			ORDER BY TABLE_NAME
		`,
			[prod_db]
		);

		console.log(`   Found ${tables.length} tables\n`);

		console.log('2️⃣ Dropping local database tables...');
		await local_conn.execute('SET FOREIGN_KEY_CHECKS = 0');

		for (const { TABLE_NAME } of tables) {
			try {
				await local_conn.execute(`DROP TABLE IF EXISTS \`${TABLE_NAME}\``);
			} catch (e) {
				console.log(`   Warning: Could not drop ${TABLE_NAME}: ${e.message}`);
			}
		}

		await local_conn.execute('SET FOREIGN_KEY_CHECKS = 1');
		console.log('   ✅ Local tables dropped\n');

		console.log('3️⃣ Copying tables from production to local...');
		console.log('   (This may take a while for large tables)\n');

		for (const { TABLE_NAME } of tables) {
			// Handle transcript tables specially - create structure but skip data
			const skip_data =
				TABLE_NAME === 'TranscriptUtterance' || TABLE_NAME === 'TranscriptUtteranceWord';

			try {
				// Get CREATE TABLE statement from prod
				const [create_result] = await prod_conn.execute(`SHOW CREATE TABLE \`${TABLE_NAME}\``);
				const create_statement = create_result[0]['Create Table'];

				// Create table in local
				await local_conn.execute(create_statement);

				if (skip_data) {
					console.log(`   ${TABLE_NAME}: Structure created (no data) ✅`);
					continue;
				}

				// Get row count
				const [count_result] = await prod_conn.execute(
					`SELECT COUNT(*) as count FROM \`${TABLE_NAME}\``
				);
				const row_count = count_result[0].count;

				if (row_count > 0) {
					// Copy data in batches to avoid timeout
					const batch_size = 1000;
					let offset = 0;
					let total_copied = 0;

					while (offset < row_count) {
						const [rows] = await prod_conn.execute(
							`SELECT * FROM \`${TABLE_NAME}\` LIMIT ? OFFSET ?`,
							[batch_size, offset]
						);

						if (rows.length > 0) {
							// Disable foreign key checks for faster insert
							await local_conn.execute('SET FOREIGN_KEY_CHECKS = 0');

							// Build bulk insert
							const columns = Object.keys(rows[0]);
							const values = rows
								.map((row) => `(${columns.map((col) => local_conn.escape(row[col])).join(',')})`)
								.join(',');

							const insert_sql = `INSERT INTO \`${TABLE_NAME}\` (\`${columns.join('`,`')}\`) VALUES ${values}`;
							await local_conn.execute(insert_sql);

							await local_conn.execute('SET FOREIGN_KEY_CHECKS = 1');

							total_copied += rows.length;
							process.stdout.write(`\r   ${TABLE_NAME}: ${total_copied}/${row_count} rows`);
						}

						offset += batch_size;
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
		await prod_conn.end();
		await local_conn.end();
	}
}

main().catch((error) => {
	console.error('❌ Error:', error.message);
	process.exit(1);
});
