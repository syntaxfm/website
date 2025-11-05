import { db } from '$server/db/client';
import { roles, userRoles } from '$server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function add_user_to_role(userId: string, roleName: string) {
	// Find the role by its name
	const role = await db.query.roles.findFirst({
		where: eq(roles.name, roleName)
	});

	if (!role) {
		throw new Error(`Role with name '${roleName}' not found.`);
	}

	// Create a UserRole entry linking the user and the role
	const userRoleId = randomUUID();
	await db.insert(userRoles).values({
		id: userRoleId,
		userId: userId,
		roleId: role.id
	});

	return { id: userRoleId, userId, roleId: role.id };
}
