import { describe, expect, it } from 'vitest';
import { to_content_edit_path, to_content_public_href } from './content_links.ts';

describe('to_content_edit_path', () => {
	it('sends each editable type to its editor', () => {
		expect(to_content_edit_path({ id: 'a1', type: 'ARTICLE' })).toBe('/admin/content/articles/a1');
		expect(to_content_edit_path({ id: 'v1', type: 'VIDEO' })).toBe('/admin/content/videos/v1');
		expect(
			to_content_edit_path({ id: 'p1', type: 'PODCAST', show: { number: 900, slug: 'x' } })
		).toBe('/admin/content/podcast/p1');
	});

	it('has no editor for newsletters, or a podcast without its show', () => {
		expect(to_content_edit_path({ id: 'n1', type: 'NEWSLETTER' })).toBeNull();
		expect(to_content_edit_path({ id: 'p2', type: 'PODCAST', show: null })).toBeNull();
	});
});

describe('to_content_public_href', () => {
	it('prefers the episode page, then the video', () => {
		expect(
			to_content_public_href({
				id: 'p1',
				type: 'PODCAST',
				show: { number: 900, slug: 'hello' },
				video: { url: 'https://youtu.be/x' }
			})
		).toBe('/show/900/hello');
		expect(
			to_content_public_href({ id: 'v1', type: 'VIDEO', video: { url: 'https://youtu.be/x' } })
		).toBe('https://youtu.be/x');
		expect(
			to_content_public_href({
				id: 'v2',
				type: 'VIDEO',
				status: 'PUBLISHED',
				slug: 'the-cure-for-ai-burnout',
				video: { url: 'https://youtu.be/x' }
			})
		).toBe('/videos/the-cure-for-ai-burnout');
		expect(to_content_public_href({ id: 'n1', type: 'NEWSLETTER' })).toBeNull();
		expect(
			to_content_public_href({ id: 'n2', type: 'NEWSLETTER', slug: 'snack-pack-21983475' })
		).toBe('/snackpack/21983475');
	});
});
