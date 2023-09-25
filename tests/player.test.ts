import { expect, test } from '@playwright/test';

test('Player works episode button and check if audio is playing', async ({ page }) => {
	await page.goto('/'); // Navigate to the root page

	const titleElement = await page.waitForSelector('.grid a .show-title');
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
