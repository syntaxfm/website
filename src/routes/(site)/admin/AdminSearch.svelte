<script lang="ts">
	interface Props {
		text?: string;
		on_input?: (next_value: string) => void;
		placeholder?: string;
		label?: string;
	}

	const uid = $props.id();
	let { text = '', on_input, placeholder = 'Search', label = 'Search' }: Props = $props();

	function handle_submit(event: SubmitEvent): void {
		event.preventDefault();
		on_input?.(text);
	}
</script>

<form class="admin-search" role="search" onsubmit={handle_submit}>
	<label class="admin-visually-hidden" for={uid}>{label}</label>
	<input id={uid} type="search" bind:value={text} {placeholder} />
	<button type="submit">Search</button>
</form>
