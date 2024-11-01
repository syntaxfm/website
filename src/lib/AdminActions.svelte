<script>
	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();
</script>

<div class="flex">
	{@render children?.()}
</div>

<style>
	div {
		gap: 10px;
		margin-bottom: 1rem;
	}
</style>
