import { fail, type Action } from '@sveltejs/kit';
import { validateToken } from './validateTurnstileToken';
import { prisma_client } from '$/server/prisma-client';
import { env } from '$env/dynamic/private';
import { user_submission_schema } from '$/lib/forms/userSubmissionSchema';
import { z } from 'zod';

export const UserSubmissionAction: Action = async function ({ request }) {
	const form = await request.formData();
	// Validate Turnsile Token
	const token = form.get('cf-turnstile-response');
	let { success, error } = await validateToken(token, env.TURNSTILE_SECRET);
	if (error) {
		return fail(400, { message: 'Failed Captcha', error });
	}
	// Save to DB
	const data = {
		submission_type: form.get('submission_type'),
		body: form.get('body'),
		name: form.get('name'),
		email: form.get('email')
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
	}

	let err;
	await prisma_client.userSubmission
		.create({
			data
		})
		.catch((error: Error) => (err = error));

	if (err) {
		console.log('ERROR saving', err);
		return fail(500, { message: 'Failed to save to DB', error: err.name });
	}
	return {
		status: 200,
		message: 'Form Submitted Successfully! Thank you.'
	};
};
