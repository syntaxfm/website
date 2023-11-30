// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { parseArgs } from 'node:util';

const options = {
	environment: { type: 'string' }
};

const prisma = new PrismaClient();

async function main() {
	const { values } = parseArgs({ options });

	// Check if roles already exist, if not, create them
	const existingRoles = await prisma.role.findMany();
	if (existingRoles.length === 0) {
		await prisma.role.createMany({
			data: [{ name: 'admin' }, { name: 'user' }, { name: 'author' }]
		});
		console.log('Roles Loaded.');
	} else {
		console.log('Roles already exist. No action taken.');
	}

	// If you are in dev seeding, hit the API and pull in even more
	// if (values.environment === 'development') {
	// 	const data = await fetch('');
	// }
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
