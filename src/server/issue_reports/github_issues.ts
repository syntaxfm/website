// Opens issues in the website's GitHub repository with a fine-grained token that can only write
// issues there (GITHUB_ISSUES_TOKEN).
import * as v from 'valibot';

export const ISSUE_REPOSITORY = 'syntaxfm/website';

const created_issue_schema = v.object({
	number: v.number(),
	html_url: v.pipe(v.string(), v.url())
});

export type CreatedIssue = v.InferOutput<typeof created_issue_schema>;

export async function create_github_issue(
	token: string,
	issue: { title: string; body: string; labels: string[] }
): Promise<CreatedIssue> {
	const response = await fetch(`https://api.github.com/repos/${ISSUE_REPOSITORY}/issues`, {
		method: 'POST',
		headers: {
			accept: 'application/vnd.github+json',
			authorization: `Bearer ${token}`,
			'content-type': 'application/json',
			'user-agent': 'syntax-website',
			'x-github-api-version': '2022-11-28'
		},
		body: JSON.stringify(issue)
	});
	if (!response.ok) {
		throw new Error(`GitHub didn’t open the issue: ${response.status} ${await response.text()}`);
	}
	return v.parse(created_issue_schema, await response.json());
}
