<script lang="ts">
	export let text = '';
</script>

<input type="text" bind:value={text} placeholder="Search" />

<style lang="postcss">
	input {
		width: 100%;
		background: transparent;
		border: var(--border);
		padding: 10px;
		font-size: var(--font-size-lg);
		color: var(--fg);
	}
</style>
