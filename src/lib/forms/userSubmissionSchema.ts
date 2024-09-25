import { z } from 'zod';

export const user_submission_schema = z.object({
	submission_type: z.enum(['POTLUCK', 'SPOOKY', 'GUEST', 'FEEDBACK', 'OTHER']), // These values should come from the Prisma enum but they arent importing so meh
	body: z.string().min(25).max(15000),
	name: z.optional(z.string().max(100)),
	email: z.optional(z.string().max(100))
});
