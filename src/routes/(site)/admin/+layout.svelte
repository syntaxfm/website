<script lang="ts">
	import { Toaster } from 'svelte-french-toast';

	let { children } = $props();
</script>

<Toaster />

<div class="admin stack">
	{@render children?.()}
</div>

<style>
	.admin {
		padding: var(--pad-medium) 0 4rem;
	}

	/*
	 * Admin table system. Scoped to `.admin` and intentionally unlayered so it
	 * overrides the global `@layer bass` table styles without affecting public
	 * or markdown-rendered tables elsewhere on the site.
	 */
	.admin :global(.table-container) {
		max-height: min(72vh, 820px);
		overflow: auto;
		border-radius: var(--br-small);
	}

	/* Sticky header that actually sticks (cells, not <thead>) with an opaque
	   fill so scrolled rows never bleed through. */
	.admin :global(thead th) {
		position: sticky;
		top: 0;
		z-index: 1;
		padding: var(--pad-small);
		white-space: nowrap;
		background-color: var(--c-bg);
		background-image: linear-gradient(var(--c-fg-1), var(--c-fg-1));
		border-bottom: 1px solid var(--c-fg-1);
	}

	/* Match header/body horizontal rhythm and tighten the over-tall rows. */
	.admin :global(tbody td) {
		padding: var(--pad-small);
		vertical-align: top;
	}

	/* Three distinct steps: base / zebra / hover (previously hover === header). */
	.admin :global(tbody tr) {
		background: transparent;
	}

	.admin :global(tbody tr:nth-child(odd)) {
		background: var(--c-fg-05);
	}

	.admin :global(tbody tr:hover) {
		background: color-mix(in oklch, var(--c-primary) 14%, transparent);
	}
</style>
