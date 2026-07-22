import { describe, expect, it } from 'vitest';
import { can_auto_update_slug, create_admin_slug, initialize_admin_slug } from './slug_editor';

describe('slug editor behavior', () => {
	it('creates normalized admin slugs', () => {
		expect(create_admin_slug('A Better Svelte 5 Editor!')).toBe('a-better-svelte-5-editor');
	});

	it('continues auto-generation for empty and previously generated slugs', () => {
		expect(can_auto_update_slug('', 'Original title')).toBe(true);
		expect(can_auto_update_slug('original-title', 'Original title')).toBe(true);
	});

	it('preserves an existing custom slug', () => {
		expect(can_auto_update_slug('editorial-url', 'Original title')).toBe(false);
		expect(initialize_admin_slug('editorial-url', 'Original title')).toBe('editorial-url');
	});

	it('initializes an empty slug without changing an existing generated slug', () => {
		expect(initialize_admin_slug('', 'Original title')).toBe('original-title');
		expect(initialize_admin_slug('original-title', 'Original title')).toBe('original-title');
	});
});
