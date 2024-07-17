<script lang="ts">
	// Why is this file called HairButton? https://github.com/syntaxfm/website/issues/1563
	import { episode_share_status } from '$/state/player';
	import type { Show } from '@prisma/client';
	import Icon from '../Icon.svelte';
	export let show: Show;

	async function share() {
		const is_possibly_mobile =
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

		if (is_possibly_mobile && navigator?.share) {
			try {
				await navigator.share({
					url: `https://syntax.fm/show/${show.number}`,
					text: 'Syntax podcast ' + show.title,
					title: show.title
				});
			} catch (err) {
				// This is here because navigator throws AbortError if the user cancels the share
				return;
			}
		} else {
			$episode_share_status = true;
		}
	}
</script>

<button class="share" on:click={share}><Icon name="share" /></button>

<style>
	button {
		--button-bg: transparent;
		--button-fg: var(--fg);
		padding: 0;
	}
</style>
