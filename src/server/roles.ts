import { prisma_client } from '$/server/prisma-client';

export async function add_user_to_role(userId: string, roleName: string) {
	// Find the role by its name
	const role = await prisma_client.role.findUnique({
		where: {
			name: roleName
		}
	});

	if (!role) {
		throw new Error(`Role with name '${roleName}' not found.`);
	}

	// Create a UserRole entry linking the user and the role
	const user_role = await prisma_client.userRole.create({
		data: {
			user: {
				connect: {
					id: userId
				}
			},
			role: {
				connect: {
					id: role.id
				}
			}
		}
	});

	return user_role;
}
