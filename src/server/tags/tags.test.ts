import { isHttpError } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The rule lives in the server function, whoever calls it: the admin page or the MCP endpoint.
// The database is a stand-in that records whether anything reached it.

const { insert, update } = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn() }));

vi.mock('$server/db/client', () => ({ db: { insert, update } }));

const { create_tag, update_tag } = await import('./tags');

const non_admin = { id: 'central-user-1', profile_id: 'profile-1', roles: [] };
const admin = { ...non_admin, roles: ['admin'] };

async function refusal_of(run: () => Promise<unknown>) {
	try {
		await run();
	} catch (refusal) {
		return isHttpError(refusal)
			? { status: refusal.status, message: refusal.body.message }
			: refusal;
	}
	return null;
}

describe('tag writes', () => {
	beforeEach(() => {
		insert.mockReset();
		update.mockReset();
	});

	it('refuses someone without the admin role before the database is touched', async () => {
		expect(await refusal_of(() => create_tag(non_admin, { name: 'Rust' }))).toEqual({
			status: 403,
			message: 'Admin access required'
		});
		expect(await refusal_of(() => update_tag(non_admin, { id: 'tag-1', name: 'Rust' }))).toEqual({
			status: 403,
			message: 'Admin access required'
		});
		expect(insert).not.toHaveBeenCalled();
		expect(update).not.toHaveBeenCalled();
	});

	it("creates a tag for an admin, with a slug from the tag's name", async () => {
		const returning = vi
			.fn()
			.mockResolvedValue([{ id: 'tag-1', name: 'Web Components', slug: 'web-components' }]);
		const values = vi.fn(() => ({ returning }));
		insert.mockReturnValue({ values });

		await expect(create_tag(admin, { name: 'Web Components' })).resolves.toEqual({
			id: 'tag-1',
			name: 'Web Components',
			slug: 'web-components'
		});
		expect(values).toHaveBeenCalledWith({ name: 'Web Components', slug: 'web-components' });
	});
});
