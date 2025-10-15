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
		color: var(--c-red);
		font-size: var(--fs-2);
		margin: 0;
	}
</style>
