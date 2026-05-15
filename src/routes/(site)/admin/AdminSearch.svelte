<script lang="ts">
	interface Props {
		text?: string;
		on_input?: (next_value: string) => void;
		placeholder?: string;
	}

	let { text = $bindable(''), on_input, placeholder = 'Search' }: Props = $props();

	function handle_input(event: Event) {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) {
			return;
		}

		on_input?.(target.value);
	}
</script>

<input type="text" bind:value={text} {placeholder} oninput={handle_input} />

<style lang="postcss">
	input {
		width: 100%;
		background: transparent;
		border: var(--border);
		padding: 10px;
		font-size: var(--font-size-base);
		color: var(--c-fg);
		border-radius: var(--br-medium);
	}
</style>
