<script lang="ts">
	import { episode_share_status, player } from '$/state/player';
	import { Show } from '@prisma/client';
	import Icon from '../Icon.svelte';
	export let show: Show;

	function share() {
		const is_possibly_mobile =
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

		if (is_possibly_mobile) {
			navigator.share({
				url: `https://syntax.fm/show/${show.number}`,
				text: 'Syntax podcast ' + show.title,
				title: show.title
			});
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
	}
</style>
