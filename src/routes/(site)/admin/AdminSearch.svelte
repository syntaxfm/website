<script lang="ts">
	interface Props {
		text?: string;
		on_input?: (next_value: string) => void;
		placeholder?: string;
		debounce_ms?: number;
	}

	let {
		text = $bindable(''),
		on_input,
		placeholder = 'Search',
		debounce_ms = 250
	}: Props = $props();

	let timer: ReturnType<typeof setTimeout> | null = null;

	function handle_input(event: Event) {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) {
			return;
		}

		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			on_input?.(target.value);
		}, debounce_ms);
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
