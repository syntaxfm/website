import { get_access_token } from '../../../../../server/auth/access_token';
import { get_github_user } from '../../../../../server/auth/github_user_methods';
import { find_session } from '../../../../../server/auth/sessions';
import { find_or_create_user } from '../../../../../server/auth/users';

// This route runs after the user has been successfully validated on GitHub
export async function GET({ url, cookies, locals }) {
	// ***   ฅ^•ﻌ•^ฅ   ***  //
	// *** SyNtAx AuTh *** //
	// 1. Pull code from Github response, this is the callback from Github
	// 2. Use code to get access token from Github
	// 3. Use access token to get user data from Github
	// 4. Use user data to create user in database
	// 5. Create session in database
	// 6. Set access token as httpOnly cookie
	// 7. Redirect to home page
	// ***   ***   ***  *** //
	// ***   ฅ^•ﻌ•^ฅ   ***  //

	// 1. Get the code from the URL to be used to get the access token
	const code = url.searchParams.get('code');
	const session_token = url.searchParams.get('state');
	const { ip, country } = locals.session;

	// If the code exists, get the access token from GitHub
	if (code && session_token) {
		//  2. Use code to get access token from Github
		const access_token = await get_access_token(code);

		if (access_token) {
			// 3. Use access token to get user data from Github
			const github_user = await get_github_user(access_token);

			// 4. Use user data to create user in database
			const user = await find_or_create_user({ github_user });

			// 5. Create session in database
			// Check to see if session exists in the database
			await find_session(access_token, session_token, user, {
				ip,
				country
			});

			// 5. Set the access token as an httpOnly cookie
			cookies.set('access_token', access_token, {
				httpOnly: true,
				path: '/',
				secure: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 24 * 365 // 1 year
			});

			return new Response('', {
				status: 302,
				headers: {
					location: '/'
				}
			});
		}
	}
	return new Response('Auth Failed', { status: 401 });
}
