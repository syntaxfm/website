import { SUBMISSION_TYPE_VALUES } from '$server/db/schema';
import { z } from 'zod';

export const user_submission_schema = z.object({
	submission_type: z.enum(SUBMISSION_TYPE_VALUES.enumValues),
	body: z.string().min(25).max(15000),
	name: z.optional(z.string().max(100)),
	email: z.optional(z.union([z.email().max(100), z.literal('')]))
});
