<script>
	/**
	 * @typedef {Object} Props
	 * @property {any} display_error
	 */

	/** @type {Props} */
	let { display_error } = $props();
</script>

{#if display_error}
	<p class="inline-error">{display_error}</p>
{/if}

<style>
	.inline-error {
		color: var(--c-red);
		font-size: var(--fs-2);
		margin: 0;
	}
</style>
