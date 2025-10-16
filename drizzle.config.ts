import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
	schema: './src/db/schema.ts',
	out: './drizzle',
	dialect: 'mysql',
	dbCredentials: {
		url: process.env.DATABASE_URL!
	},
	verbose: true,
	strict: true
});
