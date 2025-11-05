#!/usr/bin/env node
/**
 * Fast export for large tables using MySQL's native SELECT INTO OUTFILE
 * This is 10-100x faster than row-by-row processing
 */
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { createConnection } from 'mysql2/promise';
import { execSync } from 'child_process';
import path from 'path';

expand(dotenv.config());

const DB_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;
const OUTPUT_DIR = path.resolve('./db_exports');
const TABLE_NAME = process.argv[2] || 'TranscriptUtteranceWord';

async function fastExport() {
	console.log(`🚀 Fast export for large table: ${TABLE_NAME}\n`);

	if (!DB_URL) {
		console.error('❌ ERROR: DATABASE_URL is not set');
		process.exit(1);
	}

	const connection = await createConnection({
		uri: DB_URL,
		ssl: { rejectUnauthorized: false },
		// Enable LOCAL INFILE for faster operations
		flags: ['LOCAL_FILES']
	});

	try {
		// Get column names
		const [columns] = await connection.query(
			`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${TABLE_NAME}' ORDER BY ORDINAL_POSITION`
		);

		const columnNames = columns.map((col) => col.COLUMN_NAME);

		console.log(`📋 Table: ${TABLE_NAME}`);
		console.log(`📊 Columns: ${columnNames.length}`);

		// Get row count
		const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM \`${TABLE_NAME}\``);
		const rowCount = countResult[0].count;

		console.log(`📈 Rows: ${rowCount.toLocaleString()}\n`);

		if (rowCount === 0) {
			console.log('⚠️  Table is empty, nothing to export');
			return;
		}

		// Option 1: Use mysqldump (fastest, most reliable)
		console.log('Using mysqldump for fast export...\n');

		const url = new URL(DB_URL);
		const dbName = url.pathname.substr(1);

		// Build mysqldump command
		const dumpCmd = `mysqldump \\
			--host=${url.hostname} \\
			--port=${url.port || 3306} \\
			--user=${url.username} \\
			--password='${url.password}' \\
			--skip-triggers \\
			--complete-insert \\
			--skip-extended-insert \\
			--skip-add-locks \\
			--no-create-info \\
			--skip-comments \\
			--tab=${OUTPUT_DIR} \\
			--fields-terminated-by=',' \\
			--fields-enclosed-by='"' \\
			--fields-escaped-by='\\\\' \\
			--lines-terminated-by='\\n' \\
			${dbName} ${TABLE_NAME}`;

		console.log('⚠️  Note: mysqldump --tab requires FILE privilege and local server access');
		console.log('If this fails, use the alternative method below.\n');

		try {
			execSync(dumpCmd, { stdio: 'inherit' });
			console.log(`\n✅ Export complete: ${OUTPUT_DIR}/${TABLE_NAME}.txt`);
		} catch (error) {
			console.log('\n⚠️  mysqldump --tab failed (requires local server access)');
			console.log('Falling back to SELECT INTO OUTFILE...\n');

			// Option 2: Use SELECT INTO OUTFILE
			const outfile = `${OUTPUT_DIR}/${TABLE_NAME}.csv`;

			try {
				// Write header
				const header = columnNames.join(',') + '\\n';

				await connection.query(`
					SELECT ${columnNames.map((c) => `\`${c}\``).join(', ')}
					INTO OUTFILE '${outfile}'
					FIELDS TERMINATED BY ','
					OPTIONALLY ENCLOSED BY '"'
					ESCAPED BY '\\\\'
					LINES TERMINATED BY '\\n'
					FROM \`${TABLE_NAME}\`
				`);

				console.log(`✅ Export complete: ${outfile}`);
			} catch (error) {
				console.error('\n❌ SELECT INTO OUTFILE failed');
				console.error('This requires FILE privilege and secure_file_priv settings');
				console.error('\nAlternative solutions:');
				console.error('1. Skip this table (it can be regenerated from transcripts)');
				console.error('2. Use direct database-to-database migration (see below)');
				console.error('3. Export in parallel chunks (see export-parallel.js)');
				console.error(`\nError: ${error.message}`);
				process.exit(1);
			}
		}
	} finally {
		await connection.end();
	}
}

fastExport().catch((error) => {
	console.error('❌ Error:', error.message);
	process.exit(1);
});
