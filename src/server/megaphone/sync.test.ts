import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';

const { execute, find_many } = vi.hoisted(() => ({ execute: vi.fn(), find_many: vi.fn() }));

vi.mock('$server/db/client', () => ({
	db: { execute, query: { show: { findMany: find_many } } }
}));

import { checkDuplicateSpotifyIds } from './sync';

describe('checkDuplicateSpotifyIds', () => {
	beforeEach(() => {
		execute.mockReset();
		find_many.mockReset();
	});

	it('groups the Postgres shows table and iterates the postgres-js row array', async () => {
		// postgres-js resolves db.execute() to the rows array itself.
		execute.mockResolvedValue([{ spotify_id: 'spotify-1' }]);
		find_many.mockResolvedValue([
			{ number: 1, title: 'One' },
			{ number: 2, title: 'Two' }
		]);

		await expect(checkDuplicateSpotifyIds()).resolves.toEqual([
			{
				spotifyId: 'spotify-1',
				shows: [
					{ number: 1, title: 'One' },
					{ number: 2, title: 'Two' }
				]
			}
		]);

		const query: SQL = execute.mock.calls[0][0];
		const { sql } = new PgDialect().sqlToQuery(query);
		expect(sql).toContain('FROM "shows"');
		expect(sql).toContain('HAVING COUNT(*) > 1');
		expect(sql).not.toContain('`');
	});
});
