/**
 * Subjects arrive as free-form strings like "🍱 Snack Pack: Issue #35 — Svelte 5 overview".
 * Pull out the human issue number and a clean title for display (archive list and
 * the issue page), stripping the redundant "Snack Pack" / "Issue #" boilerplate.
 */
export function parseSubject(subject: string): { issue_number: number | null; title: string } {
	const number_match = subject.match(/#\s*(\d+)/);
	const issue_number = number_match ? Number(number_match[1]) : null;
	const title =
		subject
			.replace(/snack\s*pack/gi, '')
			.replace(/issue\s*#?\s*\d+/gi, '')
			.replace(/#\s*\d+/g, '')
			.replace(/^[\s:•|–—-]+|[\s:•|–—-]+$/g, '')
			.replace(/^[^\p{L}\p{N}]+/u, '')
			.replace(/\s{2,}/g, ' ')
			.trim() || subject;
	return { issue_number, title };
}
