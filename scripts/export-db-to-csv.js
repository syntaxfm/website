#!/usr/bin/env node
import { promises as fs } from 'fs';
import { createWriteStream } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { createConnection } from 'mysql2/promise';

expand(dotenv.config());

const DB_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;
const OUTPUT_DIR = './db_exports';

// Tables to skip during export (typically large tables that aren't critical)
// Set via environment variable: SKIP_TABLES="TranscriptUtteranceWord,TranscriptUtterance"
const SKIP_TABLES = process.env.SKIP_TABLES
	? process.env.SKIP_TABLES.split(',').map((t) => t.trim())
	: ['TranscriptUtteranceWord']; // Skip TranscriptUtteranceWord by default

// Set to true to resume incomplete exports (won't re-export existing files)
const RESUME_MODE = process.env.RESUME_EXPORT === 'true';

/**
 * Converts a value to CSV-safe format for PostgreSQL import
 */
function escapeCsvValue(value) {
	// Use \N for NULL values (PostgreSQL standard)
	if (value === null || value === undefined) {
		return '\\N';
	}

	// Handle dates - convert to ISO format for Postgres compatibility
	if (value instanceof Date) {
		return value.toISOString();
	}

	// Handle booleans - convert to t/f for Postgres
	if (typeof value === 'boolean') {
		return value ? 't' : 'f';
	}

	const stringValue = String(value);

	// Check if value needs to be quoted (contains comma, newline, or quote)
	if (
		stringValue.includes(',') ||
		stringValue.includes('\n') ||
		stringValue.includes('"') ||
		stringValue.includes('\r') ||
		stringValue.includes('\\')
	) {
		// Escape quotes by doubling them and escape backslashes
		return `"${stringValue.replace(/\\/g, '\\\\').replace(/"/g, '""')}"`;
	}

	return stringValue;
}

/**
 * Exports a single table to CSV
 */
async function exportTableToCsv(connection, tableName, outputPath) {
	// Skip if table is in skip list
	if (SKIP_TABLES.includes(tableName)) {
		console.log(`   ${tableName}: ⏭️  Skipped (in SKIP_TABLES)`);
		return;
	}

	// Skip if file exists and we're in resume mode
	if (RESUME_MODE) {
		try {
			await fs.access(outputPath);
			console.log(`   ${tableName}: ✅ Already exported (resume mode)`);
			return;
		} catch {
			// File doesn't exist, continue with export
		}
	}

	try {
		// Get column names
		const [columns] = await connection.query(
			`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' ORDER BY ORDINAL_POSITION`
		);

		const columnNames = columns.map((col) => col.COLUMN_NAME);

		if (columnNames.length === 0) {
			console.log(`   ⚠️  ${tableName}: No columns found`);
			return;
		}

		// Get row count
		const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
		const rowCount = countResult[0].count;

		if (rowCount === 0) {
			console.log(`   ${tableName}: 0 rows (empty) - skipping`);
			return;
		}

		// Create write stream
		const writeStream = createWriteStream(outputPath);

		// Write header
		const header = columnNames.map((col) => escapeCsvValue(col)).join(',') + '\n';
		writeStream.write(header);

		// Process data in batches to avoid memory issues
		const batchSize = 1000;
		let offset = 0;
		let totalExported = 0;

		while (offset < rowCount) {
			const [rows] = await connection.query(
				`SELECT * FROM \`${tableName}\` LIMIT ${batchSize} OFFSET ${offset}`
			);

			for (const row of rows) {
				const values = columnNames.map((col) => escapeCsvValue(row[col])).join(',') + '\n';
				writeStream.write(values);
			}

			totalExported += rows.length;
			process.stdout.write(`\r   ${tableName}: ${totalExported}/${rowCount} rows exported`);

			offset += batchSize;
		}

		// Close the stream
		await new Promise((resolve, reject) => {
			writeStream.end(() => resolve());
			writeStream.on('error', reject);
		});

		console.log(` ✅`);
	} catch (error) {
		console.error(`\n   ❌ Error exporting ${tableName}: ${error.message}`);
		throw error;
	}
}

async function main() {
	console.log('📦 Exporting database to CSV files...\n');

	if (!DB_URL) {
		console.error('❌ ERROR: Neither PROD_DATABASE_URL nor DATABASE_URL is set in .env');
		process.exit(1);
	}

	const dbUrl = new URL(DB_URL);
	const dbName = dbUrl.pathname.substr(1);
	const isProduction = process.env.PROD_DATABASE_URL ? true : false;

	console.log(`🗄️  Database: ${dbName} ${isProduction ? '(PRODUCTION)' : '(LOCAL)'}`);
	console.log(`🔗 Host: ${dbUrl.hostname}`);

	if (SKIP_TABLES.length > 0) {
		console.log(`⏭️  Skipping tables: ${SKIP_TABLES.join(', ')}`);
	}

	if (RESUME_MODE) {
		console.log(`🔄 Resume mode: Will skip already exported files`);
	}

	console.log('');

	// Create output directory
	try {
		await fs.mkdir(OUTPUT_DIR, { recursive: true });
		console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);
	} catch (error) {
		console.error(`❌ ERROR: Could not create output directory: ${error.message}`);
		process.exit(1);
	}

	// Connect to database
	const connection = await createConnection({
		uri: DB_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});

	try {
		// Get all tables
		const [tables] = await connection.query(
			`
			SELECT TABLE_NAME
			FROM information_schema.TABLES
			WHERE TABLE_SCHEMA = DATABASE()
			ORDER BY TABLE_NAME
		`
		);

		console.log(`📋 Found ${tables.length} tables to export\n`);

		// Export each table
		for (const { TABLE_NAME } of tables) {
			const outputPath = path.join(OUTPUT_DIR, `${TABLE_NAME}.csv`);
			await exportTableToCsv(connection, TABLE_NAME, outputPath);
		}

		console.log('\n✨ Export complete!');
		console.log(`\n📂 All CSV files saved to: ${OUTPUT_DIR}`);
		console.log('\nExported files:');

		// List all exported files with sizes
		const files = await fs.readdir(OUTPUT_DIR);
		for (const file of files.sort()) {
			const stats = await fs.stat(path.join(OUTPUT_DIR, file));
			const sizeKb = (stats.size / 1024).toFixed(2);
			console.log(`   • ${file} (${sizeKb} KB)`);
		}

		console.log('\n🐘 PostgreSQL Import Instructions:');
		console.log('   These CSV files are formatted for PostgreSQL with:');
		console.log('   • NULL values as \\N');
		console.log('   • Dates in ISO format');
		console.log('   • Proper escaping for special characters');
		console.log('\n   To import into PostgreSQL:');
		console.log("   \\COPY table_name FROM 'db_exports/TableName.csv' WITH (FORMAT csv, HEADER true, NULL '\\N');");
		console.log('');
	} catch (error) {
		console.error('❌ Fatal error:', error.message);
		throw error;
	} finally {
		await connection.end();
	}
}

main().catch((error) => {
	console.error('❌ Error:', error.message);
	process.exit(1);
});
