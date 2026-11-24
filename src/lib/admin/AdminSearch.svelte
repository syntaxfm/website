<script lang="ts">
	interface Props {
		text?: string;
		on_input?: (next_value: string) => void;
		placeholder?: string;
		label?: string;
	}

	// Long enough that a word is typed before the list reloads
	const SEARCH_DELAY_MS = 250;

	let { text = '', on_input, placeholder = 'Search', label = 'Search' }: Props = $props();

	let search_timer: ReturnType<typeof setTimeout> | undefined;

	function search_soon(value: string): void {
		clearTimeout(search_timer);
		search_timer = setTimeout(() => on_input?.(value), SEARCH_DELAY_MS);
	}

	function search_now(event: SubmitEvent): void {
		event.preventDefault();
		clearTimeout(search_timer);
		on_input?.(text);
	}
</script>

<form class="admin-search" role="search" onsubmit={search_now}>
	<input
		type="search"
		bind:value={text}
		oninput={(event) => search_soon(event.currentTarget.value)}
		{placeholder}
		aria-label={label}
	/>
</form>
