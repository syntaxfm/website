import { describe, expect, it } from 'vitest';
import { get_newsletter_issue_slug, newsletter_issue_id_from_slug } from './issue_slug.ts';

describe('newsletter issue slugs', () => {
	it('round-trips a Kit broadcast id', () => {
		expect(newsletter_issue_id_from_slug(get_newsletter_issue_slug('21983475'))).toBe('21983475');
	});

	it('ignores slugs the sync did not make', () => {
		expect(newsletter_issue_id_from_slug('write-once-deploy-everywhere')).toBeNull();
		expect(newsletter_issue_id_from_slug('snack-pack-')).toBeNull();
	});
});
