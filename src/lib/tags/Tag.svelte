<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
	};

	let { children }: Props = $props();
</script>

<div class="tag fs-caption">#{@render children()}</div>

<style>
	.tag {
		background-color: var(--c-bg);
		border: solid 2px var(--shade-or-tint-hard);
		border-radius: var(--br-small);
		padding: 4px 8px;
		display: inline-block;
		text-transform: lowercase;
	}
</style>
