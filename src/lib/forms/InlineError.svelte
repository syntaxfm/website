<script>
	/**
	 * @typedef {Object} Props
	 * @property {any} displayError
	 */

	/** @type {Props} */
	let { displayError } = $props();
</script>

{#if displayError}
	<p class="inline-error">{displayError}</p>
{/if}

<style>
	.inline-error {
		color: var(--red);
		font-size: var(--font-size-xs);
		margin: 0;
	}
</style>
