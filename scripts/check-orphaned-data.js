#!/usr/bin/env node
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { createConnection } from 'mysql2/promise';
import postgres from 'postgres';

expand(dotenv.config());

const MYSQL_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;
const POSTGRES_URL = process.env.POSTGRES_DATABASE_URL;

async function checkOrphanedData() {
	const mysqlConn = await createConnection({
		uri: MYSQL_URL,
		ssl: { rejectUnauthorized: false }
	});

	const pgClient = postgres(POSTGRES_URL, {
		max: 1,
		ssl: POSTGRES_URL.includes('localhost') ? false : 'prefer'
	});

	try {
		console.log('🔍 Checking for orphaned social links in MySQL...\n');

		const [orphanedInMySQL] = await mysqlConn.query(`
			SELECT sl.*
			FROM SocialLink sl
			LEFT JOIN Guest g ON sl.guest_id = g.id
			WHERE g.id IS NULL
		`);

		if (orphanedInMySQL.length > 0) {
			console.log(`❌ Found ${orphanedInMySQL.length} orphaned social links in MySQL:`);
			orphanedInMySQL.slice(0, 5).forEach((link) => {
				console.log(
					`   - ID: ${link.id}, Link: ${link.link}, Missing Guest ID: ${link.guest_id}`
				);
			});
			if (orphanedInMySQL.length > 5) {
				console.log(`   ... and ${orphanedInMySQL.length - 5} more`);
			}
		} else {
			console.log('✅ No orphaned social links found in MySQL');
		}

		console.log('\n🔍 Checking guest counts...');
		const [mysqlGuestCount] = await mysqlConn.query(`SELECT COUNT(*) as count FROM Guest`);
		const [mysqlSocialCount] = await mysqlConn.query(`SELECT COUNT(*) as count FROM SocialLink`);

		console.log(`   MySQL Guests: ${mysqlGuestCount[0].count}`);
		console.log(`   MySQL Social Links: ${mysqlSocialCount[0].count}`);

		const pgGuestCount = await pgClient`SELECT COUNT(*) as count FROM guests`;
		const pgSocialCount = await pgClient`SELECT COUNT(*) as count FROM social_links`;

		console.log(`   PostgreSQL Guests: ${pgGuestCount[0].count}`);
		console.log(`   PostgreSQL Social Links: ${pgSocialCount[0].count}`);

		console.log('\n🔍 Checking for guest IDs in MySQL that are NOT in PostgreSQL...');
		const [mysqlGuests] = await mysqlConn.query(`SELECT id FROM Guest`);
		const pgGuests = await pgClient`SELECT id FROM guests`;

		const mysqlGuestIds = new Set(mysqlGuests.map((g) => g.id));
		const pgGuestIds = new Set(pgGuests.map((g) => g.id));

		const missingInPg = [...mysqlGuestIds].filter((id) => !pgGuestIds.has(id));

		if (missingInPg.length > 0) {
			console.log(`❌ Found ${missingInPg.length} guest IDs in MySQL but NOT in PostgreSQL:`);
			console.log(missingInPg.slice(0, 5));
			if (missingInPg.length > 5) {
				console.log(`   ... and ${missingInPg.length - 5} more`);
			}
		} else {
			console.log('✅ All MySQL guest IDs are present in PostgreSQL');
		}

		console.log('\n🔍 Checking which social link guest_ids are missing from PostgreSQL...');
		const [socialLinks] = await mysqlConn.query(`SELECT DISTINCT guest_id FROM SocialLink`);
		const missingSocialGuests = socialLinks.filter(
			(sl) => !pgGuestIds.has(sl.guest_id)
		);

		if (missingSocialGuests.length > 0) {
			console.log(
				`❌ Found ${missingSocialGuests.length} social link guest_ids NOT in PostgreSQL:`
			);
			console.log(missingSocialGuests.slice(0, 5).map((g) => g.guest_id));
			if (missingSocialGuests.length > 5) {
				console.log(`   ... and ${missingSocialGuests.length - 5} more`);
			}
		} else {
			console.log('✅ All social link guest_ids exist in PostgreSQL guests');
		}
	} finally {
		await mysqlConn.end();
		await pgClient.end();
	}
}

checkOrphanedData().catch((error) => {
	console.error('❌ Error:', error.message);
	process.exit(1);
});
