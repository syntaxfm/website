<script>
	/**
	 * @typedef {Object} Props
	 * @property {any} displayError
	 */

	/** @type {Props} */
	let { displayError: display_error } = $props();
</script>

{#if display_error}
	<p class="inline-error">{display_error}</p>
{/if}

<style>
	.inline-error {
		color: var(--red);
		font-size: var(--font-size-xs);
		margin: 0;
	}
</style>
