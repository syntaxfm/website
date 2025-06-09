import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

// Safely access environment variables
const PUBLIC_GITHUB_ID = publicEnv.PUBLIC_GITHUB_ID;
const GH_SECRET = privateEnv.GH_SECRET;

const tokenURL = 'https://github.com/login/oauth/access_token';

export async function get_access_token(code: string): Promise<string> {
	if (!PUBLIC_GITHUB_ID || !GH_SECRET) {
		throw new Error('GitHub OAuth environment variables not configured');
	}

	try {
		const response = await fetch(tokenURL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify({
				client_id: PUBLIC_GITHUB_ID,
				client_secret: GH_SECRET,
				code
			})
		});

		if (!response.ok) {
			throw new Error(`Error fetching access token: ${response.statusText}`);
		}

		const data = await response.json();

		if (data.error) {
			throw new Error(`Error fetching access token: ${data.error_description}`);
		}

		return data.access_token;
	} catch (error) {
		console.error('Error:', error);
		throw error;
	}
}
