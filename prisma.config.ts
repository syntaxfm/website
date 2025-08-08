import { defineConfig } from 'prisma/config';

export default defineConfig({
	migrations: {
		seed: 'node --loader ts-node/esm prisma/seed.ts'
	}
});
