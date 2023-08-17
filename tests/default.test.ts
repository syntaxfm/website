import { expect, test } from '@playwright/test';

test('index page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'A Tasty Treats Podcast for Web Developers' })).toBeVisible();
});

test('index newsletter signup', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Join our newsletter' })).toBeVisible();
});
