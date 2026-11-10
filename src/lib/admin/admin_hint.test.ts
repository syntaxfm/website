import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { remember_admin, was_admin } from './admin_hint';

function create_storage() {
	const data = new Map<string, string>();
	return {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => data.set(key, value),
		removeItem: (key: string) => data.delete(key)
	};
}

function create_document() {
	const classes = new Set<string>();
	return {
		classes,
		documentElement: {
			classList: {
				toggle: (name: string, force: boolean) => (force ? classes.add(name) : classes.delete(name))
			}
		}
	};
}

describe('admin_hint', () => {
	let page: ReturnType<typeof create_document>;

	beforeEach(() => {
		page = create_document();
		vi.stubGlobal('localStorage', create_storage());
		vi.stubGlobal('document', page);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('knows nothing until told', () => {
		expect(was_admin()).toBe(false);
	});

	it('remembers an admin under the key app.html reads, and marks the page', () => {
		remember_admin(true);
		expect(was_admin()).toBe(true);
		expect(localStorage.getItem('is_admin')).toBe('1');
		expect(page.classes.has('is-admin')).toBe(true);
	});

	it('forgets once they are no longer an admin', () => {
		remember_admin(true);
		remember_admin(false);
		expect(was_admin()).toBe(false);
		expect(localStorage.getItem('is_admin')).toBeNull();
		expect(page.classes.has('is-admin')).toBe(false);
	});

	it('goes without when the browser blocks site data', () => {
		vi.stubGlobal('localStorage', undefined);
		expect(was_admin()).toBe(false);
		remember_admin(true);
		expect(page.classes.has('is-admin')).toBe(true);
	});
});
