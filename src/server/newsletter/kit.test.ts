import { describe, expect, it } from 'vitest';
import { to_snackpack_issue, type Broadcast } from './kit';

const NOW = new Date('2026-11-14T12:00:00Z');

function broadcast(overrides: Partial<Broadcast>): Broadcast {
	return {
		id: 26843383,
		publication_id: '1',
		created_at: '2026-11-01T10:00:00Z',
		subject: '🍱 Snack Pack: Issue #78 — Svelte 5 overview',
		description: '',
		content: '',
		public: true,
		published_at: '2026-11-01T12:00:00Z',
		send_at: '2026-11-01T12:00:00Z',
		thumbnail_alt: null,
		thumbnail_url: null,
		email_address: 'news@example.com',
		email_layout_template: '',
		...overrides
	};
}

describe('to_snackpack_issue', () => {
	it('turns a sent Snack Pack broadcast into an issue with a text id', () => {
		expect(to_snackpack_issue(broadcast({}), NOW)).toEqual({
			id: '26843383',
			issue_number: 78,
			title: 'Svelte 5 overview',
			published_at: new Date('2026-11-01T12:00:00Z')
		});
	});

	it('falls back to created_at when Kit has no published_at', () => {
		const issue = to_snackpack_issue(broadcast({ published_at: null }), NOW);
		expect(issue?.published_at).toEqual(new Date('2026-11-01T10:00:00Z'));
	});

	it.each([
		['private', { public: false }],
		['never sent', { send_at: null }],
		['scheduled for later', { published_at: '2026-12-01T12:00:00Z' }],
		['from before the archive starts', { published_at: '2021-06-01T12:00:00Z' }],
		['not a Snack Pack', { subject: 'Syntax swag drop is live' }]
	] satisfies [string, Partial<Broadcast>][])('skips a broadcast that is %s', (_, overrides) => {
		expect(to_snackpack_issue(broadcast(overrides), NOW)).toBeNull();
	});
});
