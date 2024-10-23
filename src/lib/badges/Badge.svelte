<script>
	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();
</script>

<span class="badge text-sm">
	{@render children?.()}
</span>

<style lang="postcss">
	.badge {
		background: color-mix(in lch, var(--fg), transparent 94%);
		color: var(--fg);
		padding: 2px 4px;
		border-radius: 2px;
	}
</style>
