import { defineConfig } from 'drizzle-kit';
import 'varlock/auto-load';

export default defineConfig({
	schema: './src/server/db/schema.ts',
	out: './drizzle/pg-migrations',
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
