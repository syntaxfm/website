import { UserSubmissionType } from '@prisma/client';
import { z } from 'zod';

export const user_submission_schema = z.object({
	submission_type: z.enum(UserSubmissionType),
	body: z
		.string()
		.min(25, { error: 'String must contain at least 25 character(s)' })
		.max(15000, { error: 'String must contain at most 15000 character(s)' }),
	name: z.optional(z.string().max(100, { error: 'String must contain at most 100 character(s)' })),
	email: z.optional(
		z.union([
			z
				.email({ error: 'Invalid email' })
				.max(100, { error: 'String must contain at most 100 character(s)' }),
			z.literal('')
		])
	)
});
