<script lang="ts">
	export let hidden = false;
	import Icon from '$lib/Icon.svelte';
	import { player } from '$state/player';
</script>

{#if !hidden}
	<div class:hidden class="player-visibility-controls">
		{#if $player.status === 'MINIMIZED'}
			<button type="button" class="player-expand" on:click={player.toggle_expand}
				><Icon name="expand" title="expand" /></button
			>
		{:else}
			<button type="button" class="player-collapse" on:click={player.toggle_minimize}
				><Icon name="collapse" title="collapse" /></button
			>
		{/if}
		<button on:click={player.close}>×</button>
	</div>
{/if}

<style lang="postcss">
	.player-visibility-controls {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-right: 20px;
		gap: 10px;
	}

	button {
		--button-bg: transparent;
		--button-color: var(--fg);
		padding: 0;
		width: 20px;
		height: 20px;
		box-shadow: none;
	}
</style>
