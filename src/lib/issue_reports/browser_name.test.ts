import { describe, expect, it } from 'vitest';
import { browser_name } from './browser_name';

const UA = {
	iphone_safari:
		'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1',
	iphone_chrome:
		'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0.6000.1 Mobile/15E148 Safari/604.1',
	ipad_desktop:
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
	mac_chrome:
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
	mac_firefox:
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:140.0) Gecko/20100101 Firefox/140.0',
	android_samsung:
		'Mozilla/5.0 (Linux; Android 15; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36',
	windows_edge:
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0'
};

describe('browser_name', () => {
	it('names Safari and Chrome on an iPhone', () => {
		expect(browser_name(UA.iphone_safari)).toBe('Safari 18.2 on iOS 18.2');
		expect(browser_name(UA.iphone_chrome)).toBe('Chrome 142 on iOS 18.2');
	});

	it('tells an iPad asking for the desktop site from a Mac by touch', () => {
		expect(browser_name(UA.ipad_desktop, null, 5)).toBe('Safari 18.1 on iPadOS');
		expect(browser_name(UA.ipad_desktop, null, 0)).toBe('Safari 18.1 on macOS');
	});

	it('names browsers that also say Chrome', () => {
		expect(browser_name(UA.android_samsung)).toBe('Samsung Internet 28 on Android 15');
		expect(browser_name(UA.windows_edge)).toBe('Edge 142 on Windows');
		expect(browser_name(UA.mac_firefox)).toBe('Firefox 140 on macOS');
	});

	it('prefers the brand from client hints', () => {
		const hints = {
			brands: [
				{ brand: 'Not_A Brand', version: '99' },
				{ brand: 'Chromium', version: '142' },
				{ brand: 'Google Chrome', version: '142' }
			],
			platform: 'macOS',
			mobile: false
		};
		expect(browser_name(UA.mac_chrome, hints)).toBe('Chrome 142 on macOS');
		expect(
			browser_name(UA.mac_chrome, { ...hints, brands: [{ brand: 'Brave', version: '142' }] })
		).toBe('Brave 142 on macOS');
	});

	it('still says something for an unknown browser', () => {
		expect(browser_name('curl/8.0')).toBe('Unknown browser');
	});
});
