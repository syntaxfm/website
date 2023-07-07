<script lang="ts">
	import { browser } from '$app/environment';
	import Icon from '$lib/Icon.svelte';
	import { searching } from '$state/search';
	export let q = '';
</script>

<button
	class="button-reset"
	on:click={() => {
		$searching = true;
	}}
>
	<Icon name="search" />

	{#if browser}
		<div class="shortcut">
			<kbd>{navigator.platform === 'MacIntel' ? '⌘' : 'Ctrl'}</kbd> <kbd>K</kbd>
		</div>
	{/if}
</button>

<style lang="postcss">
	.button-reset {
		box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		color: var(--color);
	}

	.shortcut {
		display: flex;
		gap: 4px;
		align-items: center;
		background-color: rgba(255, 255, 255, 0.1);
		padding: 4px;
	}
</style>
