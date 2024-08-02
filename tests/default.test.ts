import { expect, test } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test('index page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(
		page.getByRole('heading', { name: 'Tasty Treats for Web Developers' })
	).toBeVisible();
});

test('Got about page', async ({ page }) => {
	await page.goto('/');
	await page.click('a:has-text("About")');
	// Check for an h1 with the text "All Episodes"
	await expect(page.locator('h1:has-text("About Syntax")')).toBeVisible();
});

test('admin action should require login', async ({ request, baseURL }) => {
	const response = await request.post(`/admin/shows?/delete_all_shows`, {
		headers: {
			'Content-Type': 'multipart/form-data',
			Origin: `${baseURL}`
		}
	});

	expect(response.ok()).toBeTruthy();
	const body = await response.json();
	expect(body.status).toBe(302);
	expect(body.location).toBe('/login');

	const result = await prisma.guest.findMany();
	expect(result.length).not.toBe(0);
});

test('Got to podcast detail page', async ({ page }) => {
	await page.goto('/');
	// Click the navigation link named "Shows"
	await page.click('a:has-text("Shows")');

	// Check for an h1 with the text "All Episodes"
	await expect(page.locator('h1:has-text("All Episodes")')).toBeVisible();

	// Find the first link under the .list class and save the h4 value as title
	const titleElement = await page.waitForSelector('.list a .show-title');
	const title = await titleElement.textContent();

	// Click the first link under the .list class
	await page.click('.list a');

	// Check the next page for an h1 with the same title
	const h1Element = await page.waitForSelector(`h1:has-text("${title}")`);
	const h1Text = await h1Element.textContent();
	expect(h1Text).toBe(title);
});

test('make sure all pages load without error', async ({ page }) => {
	await page.goto('/');

	// Wait for the page to be fully loaded
	await page.waitForLoadState('load');

	const bodyElement = await page.$('body');

	expect(bodyElement).toBeTruthy();
});
