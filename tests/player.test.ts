import { expect, test } from '@playwright/test';

test('Player plays the YouTube video by default for episodes with a video', async ({ page }) => {
	await page.goto('/'); // Navigate to the root page

	// Episodes with a video default to playing it instead of the audio
	const card = page.locator('article.has-youtube').first();
	const title = await card.getByTestId('show-card-title').textContent();

	await card.getByTestId('play-show').click();

	// The global YouTube player loads the episode's video
	const youtube_player = page.getByTestId('global-youtube-player');
	await expect(youtube_player).toBeAttached();
	await expect(youtube_player.locator('youtube-video')).toHaveAttribute(
		'src',
		/youtube\.com\/watch\?v=/
	);

	// And the audio file stays paused
	const is_audio_playing = await page.evaluate(() => {
		const audio_element = document.querySelector('audio');
		return !!audio_element && !audio_element.paused;
	});
	expect(is_audio_playing).toBe(false);

	await expect(page.locator('#player_show_title')).toContainText(title!.trim());
});

test('Player works episode button and check if audio is playing', async ({ page }) => {
	// Prefer audio so episodes play the audio file instead of the YouTube video
	await page.addInitScript(() => localStorage.setItem('media_preference', 'AUDIO'));
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
