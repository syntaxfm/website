<script lang="ts">
	interface MultiSelectOption {
		id: string;
		name: string;
	}

	interface Props {
		options: MultiSelectOption[];
		selected_ids?: string[];
		label?: string;
		placeholder?: string;
	}

	let {
		options,
		selected_ids = $bindable<string[]>([]),
		label = 'Select',
		placeholder = 'Search'
	}: Props = $props();

	let search_value = $state('');
	let is_open = $state(false);

	let selected_option_ids = $derived(new Set(selected_ids));

	let selected_options = $derived(
		selected_ids
			.map((selected_id) => options.find((option) => option.id === selected_id))
			.filter((option): option is MultiSelectOption => Boolean(option))
	);

	let filtered_options = $derived(
		options.filter((option) => {
			if (selected_option_ids.has(option.id)) {
				return false;
			}

			if (!search_value) {
				return true;
			}

			return option.name.toLowerCase().includes(search_value.toLowerCase());
		})
	);

	function handle_input(event: Event) {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) {
			return;
		}

		search_value = target.value;
		is_open = true;
	}

	function add_option(option_id: string) {
		if (selected_ids.includes(option_id)) {
			return;
		}

		selected_ids = [...selected_ids, option_id];
		search_value = '';
		is_open = true;
	}

	function remove_option(option_id: string) {
		selected_ids = selected_ids.filter((selected_id) => selected_id !== option_id);
	}

	function handle_keydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			is_open = false;
		}
	}
</script>

<svelte:window onkeydown={handle_keydown} />

<div class="stack" style:--stack-gap="var(--pad-xsmall)" aria-expanded={is_open}>
	<label for="multi-select-search" class="fs-2">{label}</label>
	<input
		id="multi-select-search"
		type="text"
		value={search_value}
		{placeholder}
		autocomplete="off"
		onfocus={() => (is_open = true)}
		oninput={handle_input}
	/>

	{#if selected_options.length > 0}
		<ul class="no-list stack" style:--stack-gap="var(--pad-xsmall)" aria-label="Selected options">
			{#each selected_options as selected_option (selected_option.id)}
				<li class="split" style:--split-gap="var(--pad-xsmall)">
					<span>{selected_option.name}</span>
					<button
						type="button"
						onclick={() => remove_option(selected_option.id)}
						aria-label={`Remove ${selected_option.name}`}>×</button
					>
				</li>
			{/each}
		</ul>
	{/if}

	{#if is_open}
		<div
			class="stack bg-shade-or-tint-light br-small"
			style="--stack-gap: 1px; max-height: 200px; overflow-y: auto"
			role="listbox"
			aria-label={label}
		>
			{#if filtered_options.length === 0}
				<p class="fs-2">No matches</p>
			{:else}
				{#each filtered_options as option (option.id)}
					<button
						type="button"
						role="option"
						aria-selected="false"
						onclick={() => add_option(option.id)}
					>
						{option.name}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>
