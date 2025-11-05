#!/usr/bin/env node
/**
 * Export large table in parallel chunks for faster processing
 * Splits table into N chunks and exports them simultaneously
 */
import { promises as fs } from 'fs';
import { createWriteStream } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { createConnection } from 'mysql2/promise';

expand(dotenv.config());

const DB_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;
const OUTPUT_DIR = './db_exports';
const TABLE_NAME = process.argv[2] || 'TranscriptUtteranceWord';
const NUM_WORKERS = parseInt(process.argv[3]) || 4; // Number of parallel workers

function escapeCsvValue(value) {
	if (value === null || value === undefined) {
		return '\\N';
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	if (typeof value === 'boolean') {
		return value ? 't' : 'f';
	}

	const stringValue = String(value);

	if (
		stringValue.includes(',') ||
		stringValue.includes('\n') ||
		stringValue.includes('"') ||
		stringValue.includes('\r') ||
		stringValue.includes('\\')
	) {
		return `"${stringValue.replace(/\\/g, '\\\\').replace(/"/g, '""')}"`;
	}

	return stringValue;
}

async function exportChunk(chunkId, offset, limit, columnNames, outputPath) {
	const connection = await createConnection({
		uri: DB_URL,
		ssl: { rejectUnauthorized: false }
	});

	try {
		const writeStream = createWriteStream(outputPath);
		let exported = 0;

		// Export in batches within this chunk
		const batchSize = 1000;
		let currentOffset = offset;

		while (currentOffset < offset + limit) {
			const [rows] = await connection.query(
				`SELECT * FROM \`${TABLE_NAME}\` LIMIT ${batchSize} OFFSET ${currentOffset}`
			);

			if (rows.length === 0) break;

			for (const row of rows) {
				const values = columnNames.map((col) => escapeCsvValue(row[col])).join(',') + '\n';
				writeStream.write(values);
			}

			exported += rows.length;
			currentOffset += batchSize;

			// Progress for this worker
			process.stdout.write(`\r   Worker ${chunkId}: ${exported.toLocaleString()} rows`);
		}

		await new Promise((resolve) => writeStream.end(resolve));
		console.log(` ✅`);
	} finally {
		await connection.end();
	}
}

async function mergeChunks(chunkFiles, outputFile, columnNames) {
	console.log('\n📦 Merging chunks...');

	const writeStream = createWriteStream(outputFile);

	// Write header
	const header = columnNames.map((col) => escapeCsvValue(col)).join(',') + '\n';
	writeStream.write(header);

	// Merge all chunks
	for (let i = 0; i < chunkFiles.length; i++) {
		const chunkData = await fs.readFile(chunkFiles[i], 'utf8');
		writeStream.write(chunkData);
		await fs.unlink(chunkFiles[i]); // Delete chunk file
		process.stdout.write(`\r   Merged ${i + 1}/${chunkFiles.length} chunks`);
	}

	await new Promise((resolve) => writeStream.end(resolve));
	console.log(' ✅');
}

async function parallelExport() {
	console.log(`🚀 Parallel export for: ${TABLE_NAME}`);
	console.log(`👷 Workers: ${NUM_WORKERS}\n`);

	if (!DB_URL) {
		console.error('❌ ERROR: DATABASE_URL is not set');
		process.exit(1);
	}

	// Create output directory
	await fs.mkdir(OUTPUT_DIR, { recursive: true });

	const connection = await createConnection({
		uri: DB_URL,
		ssl: { rejectUnauthorized: false }
	});

	try {
		// Get column names
		const [columns] = await connection.query(
			`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${TABLE_NAME}' ORDER BY ORDINAL_POSITION`
		);

		const columnNames = columns.map((col) => col.COLUMN_NAME);

		// Get row count
		const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM \`${TABLE_NAME}\``);
		const rowCount = countResult[0].count;

		console.log(`📊 Total rows: ${rowCount.toLocaleString()}`);
		console.log(`📋 Columns: ${columnNames.length}\n`);

		if (rowCount === 0) {
			console.log('⚠️  Table is empty');
			return;
		}

		// Calculate chunk size
		const chunkSize = Math.ceil(rowCount / NUM_WORKERS);
		console.log(`📦 Chunk size: ${chunkSize.toLocaleString()} rows per worker\n`);

		// Export chunks in parallel
		const chunkFiles = [];
		const promises = [];

		for (let i = 0; i < NUM_WORKERS; i++) {
			const offset = i * chunkSize;
			const limit = Math.min(chunkSize, rowCount - offset);

			if (limit <= 0) break;

			const chunkFile = path.join(OUTPUT_DIR, `${TABLE_NAME}_chunk_${i}.csv`);
			chunkFiles.push(chunkFile);

			promises.push(exportChunk(i + 1, offset, limit, columnNames, chunkFile));
		}

		await Promise.all(promises);

		// Merge chunks
		const finalFile = path.join(OUTPUT_DIR, `${TABLE_NAME}.csv`);
		await mergeChunks(chunkFiles, finalFile, columnNames);

		const stats = await fs.stat(finalFile);
		const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

		console.log(`\n✨ Export complete!`);
		console.log(`📁 File: ${finalFile}`);
		console.log(`📊 Size: ${sizeMB} MB`);
		console.log(`📈 Rows: ${rowCount.toLocaleString()}\n`);
	} finally {
		await connection.end();
	}
}

parallelExport().catch((error) => {
	console.error('❌ Error:', error.message);
	process.exit(1);
});
