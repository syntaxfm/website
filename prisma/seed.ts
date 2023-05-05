import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
