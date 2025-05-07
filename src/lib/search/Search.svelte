<script lang="ts">
	import { browser } from '$app/environment';
	import Icon from '$lib/Icon.svelte';
	import { searching } from '$state/search';
	const shortcut = !browser || navigator.platform === 'MacIntel' ? '⌘' : 'Ctrl';
</script>

<button
	class="button-reset"
	aria-label="Search (shortcut: {shortcut}K)"
	onclick={() => {
		$searching = true;
	}}
>
	<Icon name="search" />

	<div class="shortcut">
		<kbd>{shortcut}K</kbd>
	</div>
</button>

<style lang="postcss">
	.button-reset {
		box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.0786987545689);
		border-radius: 20px;
		color: var(--fg);
	}

	.shortcut {
		display: flex;
		gap: 4px;
		align-items: center;
		background-color: rgba(255, 255, 255, 0.1);
		padding: 4px;
		@media (--below-med) {
			display: none;
		}
	}

	.shortcut kbd {
		font-family: system-ui, sans-serif;
		font-size: var(--font-size-xs);
	}
</style>
