<script>
	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();
</script>

<div class="badges">
	{@render children?.()}
</div>

<style lang="postcss">
	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
</style>
