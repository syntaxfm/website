<script lang="ts">
	import type { Show } from '@prisma/client';
	import Icon from '../Icon.svelte';
	import { check_for_cached_mp3 } from '$state/player_offline';

	export let show: Show;

	let save_status: 'INITIAL' | 'UNSAVED' | 'SAVING' | 'SAVED' = 'INITIAL';
	check_for_cached_mp3(show.url).then((response) => {
		if (response) {
			save_status = 'SAVED';
		} else {
			save_status = 'UNSAVED';
		}
	});

	function save_show_for_offline() {
		save_status = 'SAVING';
		const mp3Url = show.url;

		// Fetch the MP3 file
		fetch(mp3Url)
			.then((response) => response.blob())
			.then((blob) => {
				// Create a new response with the MP3 blob
				const response = new Response(blob, {
					headers: {
						'Content-Type': 'audio/mpeg',
						'Content-Length': blob.size.toString(),
						Metadata: JSON.stringify(show)
					}
				});

				// Open the cache and store the MP3 response
				caches
					.open('mp3-cache')
					.then((cache) => {
						cache.put(mp3Url, response);
						save_status = 'SAVED';
						console.log('MP3 file saved for offline listening.');
					})
					.catch((error) => {
						console.error('Failed to save MP3 file:', error);
					});
			})
			.catch((error) => {
				console.error('Failed to fetch MP3 file:', error);
			});
	}
</script>

<button on:click={save_show_for_offline} title="Save for offline">
	<div class={save_status}>
		<Icon name="thumbtack" />
	</div>
</button>

<style>
	button {
		--button-bg: transparent;
		--button-fg: var(--fg);
	}
	button > div {
		transition:
			0.2s translate linear(0, 0.75, 1),
			0.2s 0.2s opacity linear(0, 0.75, 1),
			0.2s rotate linear(0, -0.1, 0.75, 1);
	}
	.INITIAL {
		opacity: 0;
		pointer-events: none;
	}

	.UNSAVED {
		pointer-events: all;
	}

	.SAVING {
		animation: pulse 1s infinite;
	}

	.SAVED {
		rotate: -46deg;
		translate: 2px 1px;
	}

	@keyframes pulse {
		0% {
			opacity: 1;
			transform: scale(0.8);
		}

		50% {
			opacity: 0.7;
			transform: scale(1);
		}

		100% {
			opacity: 1;
			transform: scale(0.8);
		}
	}
</style>
