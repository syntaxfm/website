import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTableColumns, getTableName, type Table } from 'drizzle-orm';
import { aiShowNote } from '$server/db/schema';

type Row = Record<string, unknown>;
type Insert = { table: Table; values: Row | Row[]; returning?: unknown };

const { inserts } = vi.hoisted(() => ({ inserts: [] as Insert[] }));

vi.mock('./openai', () => ({ generate_ai_notes: vi.fn() }));
vi.mock('$server/db/client', () => {
	const tx = {
		insert(table: Table) {
			return {
				values(values: Insert['values']) {
					const insert: Insert = { table, values };
					inserts.push(insert);
					return {
						returning(fields: unknown) {
							insert.returning = fields;
							return Promise.resolve([{ id: 42 }]);
						},
						then(resolve: (value: undefined) => void) {
							resolve(undefined);
						}
					};
				}
			};
		}
	};
	return {
		db: { transaction: (run: (transaction: typeof tx) => Promise<unknown>) => run(tx) }
	};
});

import { save_ai_notes_to_db } from './db';

describe('save_ai_notes_to_db', () => {
	beforeEach(() => {
		inserts.length = 0;
	});

	it('reads the new note id with returning() and links every child row by show_note_id', async () => {
		const note = await save_ai_notes_to_db(
			{
				title: 'Title',
				description: 'Description',
				notes: '',
				summary: [{ time: '00:00', text: 'Intro', description: '' }],
				tweets: ['A tweet'],
				listener_tweets: [],
				topics: ['CSS'],
				links: [{ name: 'Syntax', url: 'https://syntax.fm', timestamp: '' }],
				speaker_times: [],
				guests: [],
				provider: 'anthropic'
			},
			{ number: 900 }
		);

		expect(note).toEqual({ id: 42 });
		expect(inserts[0].table).toBe(aiShowNote);
		expect(inserts[0].returning).toEqual({ id: aiShowNote.id });

		const child_inserts = inserts.slice(1);
		expect(child_inserts.map(({ table }) => getTableName(table))).toEqual([
			'ai_summary_entries',
			'ai_tweets',
			'topics',
			'links'
		]);
		for (const { table, values } of child_inserts) {
			const columns = Object.keys(getTableColumns(table));
			for (const row of Array.isArray(values) ? values : [values]) {
				expect(row.show_note_id).toBe(42);
				expect(Object.keys(row).every((key) => columns.includes(key))).toBe(true);
			}
		}
	});
});
