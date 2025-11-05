import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
	schema: './src/server/db/schema.ts',
	out: './drizzle/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.POSTGRES_DATABASE_URL || process.env.DATABASE_URL!
	},
	verbose: true,
	strict: true,
	// PostgreSQL-specific options
	schemaFilter: ['public'],
	tablesFilter: ['!_*'] // Exclude tables starting with underscore
});
