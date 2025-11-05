import { fail, type Action } from '@sveltejs/kit';
import { validateToken } from './validateTurnstileToken';
import { db } from '$server/db/client';
import { userSubmission } from '$server/db/schema';
import { env } from '$env/dynamic/private';
import { user_submission_schema } from '$lib/forms/userSubmissionSchema';
import { z } from 'zod';
import { randomUUID } from 'crypto';

export const user_submission_action: Action = async function ({ locals }) {
	// Validate Turnsile Token
	let { error } = await validateToken(
		locals.form_data['cf-turnstile-response'],
		env.TURNSTILE_SECRET
	);
	if (error) {
		return fail(400, { message: 'Failed Captcha', error });
	}
	// Save to DB
	const data = {
		submission_type: locals.form_data['submission_type'],
		body: locals.form_data['body'],
		name: locals.form_data['name'],
		email: locals.form_data['email']
	};
	// Validate
	const parsed = user_submission_schema.safeParse(data);
	if (!parsed.success) {
		if (parsed.error instanceof z.ZodError) {
			const errors = parsed.error.flatten();
			return fail(400, {
				message: 'Failed to validate form',
				error: 'See above for details',
				fieldErrors: errors.fieldErrors
			});
		}
		return fail(400, {
			message: 'Failed to validate form',
			error: 'Unknown error'
		});
	}

	try {
		await db.insert(userSubmission).values({
			id: randomUUID(),
			...parsed.data,
			updated_at: new Date()
		});

		return {
			status: 200,
			message: 'Form Submitted Successfully! Thank you.'
		};
	} catch (error: any) {
		console.log('ERROR saving', error);
		return fail(500, { message: 'Failed to save to DB', error: error.name });
	}
};
