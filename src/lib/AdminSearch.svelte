<script lang="ts">
	interface Props {
		text?: string;
	}

	let { text = $bindable('') }: Props = $props();
</script>

<input type="text" bind:value={text} placeholder="Search" />

<style lang="postcss">
	input {
		width: 100%;
		background: transparent;
		border: var(--border);
		padding: 10px;
		font-size: var(--font-size-base);
		color: var(--fg);
		border-radius: var(--brad);
	}
</style>
