import { UserSubmissionType } from '@prisma/client';
import { z } from 'zod';

export const user_submission_schema = z.object({
	submission_type: z.nativeEnum(UserSubmissionType),
	body: z.string().min(25).max(15000),
	name: z.optional(z.string().max(100)),
	email: z.optional(z.union([z.string().email().max(100), z.literal('')]))
});
