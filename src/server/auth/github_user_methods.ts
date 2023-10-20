import { GITHUB_USER_URL, type GithubUser } from '$const';

export function get_github_user(access_token: string): Promise<GithubUser> {
	return fetch(GITHUB_USER_URL, {
		headers: {
			Accept: 'application/json',
			Authorization: `Bearer ${access_token}`
		}
	}).then((r) => r.json());
}
