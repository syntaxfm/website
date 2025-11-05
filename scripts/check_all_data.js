import 'dotenv/config';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
	console.log('🔍 Checking all database tables and data...\n');

	// Get all tables
	const [tables] = await connection.execute(`
		SELECT TABLE_NAME, TABLE_ROWS
		FROM information_schema.TABLES
		WHERE TABLE_SCHEMA = DATABASE()
		ORDER BY TABLE_NAME
	`);

	console.log('📋 All Tables and Row Counts:');
	console.log('='.repeat(60));

	for (const table of tables) {
		const tableName = table.TABLE_NAME;
		const estimatedRows = table.TABLE_ROWS;

		// Get actual count for important tables
		try {
			const [result] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
			const actualCount = result[0].count;
			console.log(`${tableName.padEnd(30)} ${actualCount.toString().padStart(10)} rows`);
		} catch (e) {
			console.log(`${tableName.padEnd(30)} ${estimatedRows.toString().padStart(10)} rows (estimated)`);
		}
	}

	console.log('='.repeat(60));

	// Check specifically for Show/Shows tables
	console.log('\n🎯 Looking for Show-related tables:');
	const showTables = tables.filter(t =>
		t.TABLE_NAME.toLowerCase().includes('show')
	);

	for (const table of showTables) {
		const [count] = await connection.execute(`SELECT COUNT(*) as count FROM \`${table.TABLE_NAME}\``);
		console.log(`  ${table.TABLE_NAME}: ${count[0].count} rows`);

		if (count[0].count > 0) {
			const [sample] = await connection.execute(`SELECT * FROM \`${table.TABLE_NAME}\` LIMIT 1`);
			console.log(`    Sample data:`, sample[0]);
		}
	}

} catch (error) {
	console.error('❌ Error:', error.message);
	process.exit(1);
} finally {
	await connection.end();
}
