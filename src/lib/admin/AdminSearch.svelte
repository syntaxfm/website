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

	// Enter searches at once. Not a <form>, so it can sit inside an editor's form.
	function search_on_enter(event: KeyboardEvent & { currentTarget: HTMLInputElement }): void {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		clearTimeout(search_timer);
		on_input?.(event.currentTarget.value);
	}
</script>

<search class="admin-search">
	<input
		type="search"
		bind:value={text}
		oninput={(event) => search_soon(event.currentTarget.value)}
		onkeydown={search_on_enter}
		{placeholder}
		aria-label={label}
	/>
</search>
