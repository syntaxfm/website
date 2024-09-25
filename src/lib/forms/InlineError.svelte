<script>
	export let displayError;
</script>

{#if displayError}
	<p class="inline-error">{displayError}</p>
{/if}

<style>
	.inline-error {
		color: red;
		font-size: 0.8rem;
		margin: 0;
	}
</style>
