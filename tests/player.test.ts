import { expect, test } from '@playwright/test';

test('Player works episode button and check if audio is playing', async ({ page }) => {
	await page.goto('/'); // Navigate to the root page

	const title_element = await page.getByTestId('show-card-title').first();
	const title = await title_element.textContent();

	// Click the button with text that includes "play episode" (case-insensitive)
	await page.getByTestId('play-show').first().click();
	await page.waitForTimeout(500);

	// Execute JavaScript within the page to check if the audio is playing
	const is_playing = await page.evaluate(() => {
		const audio_element = document.querySelector('audio'); // Adjust the selector as needed
		return !audio_element?.paused; // Returns false if paused, true if playing
	});

	expect(is_playing).toBe(true); // Assert that the audio is playing

	const player_header = await page.waitForSelector('#player_show_title');
	const player_title = await player_header.textContent();

	expect(player_title).toContain(title);
});
