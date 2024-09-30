import { fail, type Action } from '@sveltejs/kit';
import { validateToken } from './validateTurnstileToken';
import { prisma_client } from '$/server/prisma-client';
import { env } from '$env/dynamic/private';
import { user_submission_schema } from '$/lib/forms/userSubmissionSchema';
import { z } from 'zod';

export const UserSubmissionAction: Action = async function ({ request, locals }) {
	const form = await request.formData();
	// Validate Turnsile Token

	let { success, error } = await validateToken(
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

	return prisma_client.userSubmission
		.create({
			data: parsed.data
		})
		.then((result) => {
			return {
				status: 200,
				message: 'Form Submitted Successfully! Thank you.'
			};
		})
		.catch((error: Error) => {
			console.log('ERROR saving', error);
			return fail(500, { message: 'Failed to save to DB', error: error.name });
		});
};
