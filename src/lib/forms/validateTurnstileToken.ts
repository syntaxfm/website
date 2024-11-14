interface TokenValidateResponse {
	'error-codes': string[];
	success: boolean;
	action: string;
	cdata: string;
}

export async function validateToken(
	token: string | FormDataEntryValue | null | unknown,
	secret: string
) {
	if (!token || typeof token !== 'string') {
		return {
			success: false,
			error: 'Missing Captcha Token'
		};
	}
	const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			response: token,
			secret: secret
		})
	});

	const data: TokenValidateResponse = await response.json();

	return {
		// Return the status
		success: data.success,
		// Return the first error if it exists
		error: data['error-codes']?.length ? data['error-codes'][0] : null
	};
}
