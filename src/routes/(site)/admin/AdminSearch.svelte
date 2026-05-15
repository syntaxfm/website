<script lang="ts">
	interface Props {
		text?: string;
		on_input?: (next_value: string) => void;
		placeholder?: string;
	}

	let { text = '', on_input, placeholder = 'Search' }: Props = $props();

	let value = $state(text);

	function handle_submit(event: Event) {
		event.preventDefault();
		on_input?.(value);
	}
</script>

<form class="flex" style:--flex-gap="var(--pad-xsmall)" onsubmit={handle_submit}>
	<input type="text" bind:value {placeholder} />
	<button type="submit">Search</button>
</form>

<style lang="postcss">
	form {
		width: 100%;
	}

	input {
		flex: 1;
		background: transparent;
		border: var(--border);
		padding: 10px;
		font-size: var(--font-size-base);
		color: var(--c-fg);
		border-radius: var(--br-medium);
	}
</style>
