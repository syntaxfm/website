import { describe, expect, it } from 'vitest';
import { proxied_image_url } from './image_proxy';

describe('proxied_image_url', () => {
	it('sends YouTube thumbnails and GitHub avatars through the proxy', () => {
		expect(proxied_image_url('https://i.ytimg.com/vi_webp/abc/maxresdefault.webp')).toBe(
			'/admin/image-proxy?url=https%3A%2F%2Fi.ytimg.com%2Fvi_webp%2Fabc%2Fmaxresdefault.webp'
		);
		expect(proxied_image_url('https://github.com/wesbos.png')).not.toBeNull();
	});

	it('leaves everything else alone', () => {
		expect(proxied_image_url('https://evil.example/x.png')).toBeNull();
		expect(proxied_image_url('http://i.ytimg.com/x.jpg')).toBeNull();
		expect(proxied_image_url('/favicon.png')).toBeNull();
		expect(proxied_image_url('data:image/png;base64,AAAA')).toBeNull();
	});
});
