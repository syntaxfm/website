<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
	};

	let { children }: Props = $props();
</script>

<!-- TODO make this the actual tag -->
<a href="/tags/" class="tag fs-caption">#{@render children()}</a>

<style>
	.tag {
		display: inline-block;
		border: solid 2px var(--c-shade-or-tint-hard);
		border-radius: var(--br-small);
		padding: 4px 8px;
		display: inline-block;
		text-transform: lowercase;
	}
</style>
