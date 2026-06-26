import { form } from '$app/server';
import { env } from '$env/dynamic/private';
import { z } from 'zod';
import { db } from '$server/db/client';
import { userSubmission } from '$server/db/schema';
import { user_submission_schema } from './userSubmissionSchema';
import { validateToken } from './validateTurnstileToken';

const submission_form_schema = user_submission_schema.extend({
	cf_turnstile_response: z.string().optional()
});

export const submit_user_submission = form(submission_form_schema, async (data) => {
	const { cf_turnstile_response: turnstile_token, submission_type, body, name, email } = data;

	const { success, error } = await validateToken(turnstile_token, env.TURNSTILE_SECRET);
	if (!success) {
		return { success: false, message: `Captcha failed${error ? `: ${error}` : ''}` };
	}

	try {
		await db.insert(userSubmission).values({
			submission_type,
			body,
			name: name || null,
			email: email || null
		});

		return { success: true, message: 'Form submitted successfully! Thank you.' };
	} catch (err) {
		console.error('Failed to save user submission', err);
		return {
			success: false,
			message: 'Something went wrong saving your submission. Please try again.'
		};
	}
});
