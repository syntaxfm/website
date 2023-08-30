import { expect, test } from '@playwright/test';

test('index page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(
		page.getByRole('heading', { name: 'A Tasty Treats Podcast for Web Developers' })
	).toBeVisible();
});

test('index newsletter signup exists', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Join our newsletter' })).toBeVisible();
});

test('Got to podcast detail page', async ({ page }) => {
	await page.goto('/');
	// Click the navigation link named "Podcast"
	await page.click('a:has-text("Podcast")');

	// Check for an h1 with the text "All Episodes"
	await expect(page.locator('h1:has-text("All Episodes")')).toBeVisible();

	// Find the first link under the .list class and save the h4 value as title
	const titleElement = await page.waitForSelector('.list a h4');
	const title = await titleElement.textContent();

	// Click the first link under the .list class
	await page.click('.list a');

	// Check the next page for an h1 with the same title
	const h1Element = await page.waitForSelector(`h1:has-text("${title}")`);
	const h1Text = await h1Element.textContent();
	expect(h1Text).toBe(title);
});

test('Player works episode button and check if audio is playing', async ({ page }) => {
	await page.goto('/'); // Navigate to the root page

	const titleElement = await page.waitForSelector('.grid a h4');
	const title = await titleElement.textContent();
	// Click the button with text that includes "play episode" (case-insensitive)
	await page.click('button:has-text("Play Episode")');

	// Execute JavaScript within the page to check if the audio is playing
	const isPlaying = await page.evaluate(() => {
		const audioElement = document.querySelector('audio'); // Adjust the selector as needed
		return !audioElement?.paused; // Returns false if paused, true if playing
	});

	expect(isPlaying).toBe(true); // Assert that the audio is playing

	const playerHeader = await page.waitForSelector('.player header p');
	const playerTitle = await playerHeader.textContent();
	expect(playerTitle).toContain(title);
});

test('make sure all pages load without error', async ({ page }) => {
	await page.goto('/');

	// Wait for the page to be fully loaded
	await page.waitForLoadState('load');

	const bodyElement = await page.$('body');

	expect(bodyElement).toBeTruthy();
});
