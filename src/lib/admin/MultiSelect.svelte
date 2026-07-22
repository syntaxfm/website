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
		id?: string;
		name?: string;
		disabled?: boolean;
		onchange?: (next_selected_ids: string[]) => void;
	}

	const VISIBLE_OPTION_LIMIT = 50;
	const uid = $props.id();

	let {
		options,
		selected_ids = $bindable<string[]>([]),
		label = 'Select',
		placeholder = 'Search',
		id = `${uid}-search`,
		name,
		disabled = false,
		onchange
	}: Props = $props();

	const listbox_id = `${uid}-listbox`;
	const selected_list_id = `${uid}-selected`;
	let search_value = $state('');
	let is_open = $state(false);
	let active_index = $state(-1);
	let combobox_element: HTMLInputElement | undefined;

	let selected_options = $derived(
		selected_ids
			.map((selected_id) => options.find((option) => option.id === selected_id))
			.filter((option): option is MultiSelectOption => Boolean(option))
	);

	let filtered_options = $derived(
		options.filter((option) => {
			if (selected_ids.includes(option.id)) {
				return false;
			}

			if (!search_value) {
				return true;
			}

			return option.name.toLowerCase().includes(search_value.toLowerCase());
		})
	);
	let visible_options = $derived(filtered_options.slice(0, VISIBLE_OPTION_LIMIT));
	let additional_match_count = $derived(filtered_options.length - visible_options.length);
	let active_option = $derived(visible_options[active_index]);
	let active_option_id = $derived(active_option ? `${uid}-option-${active_index}` : undefined);

	function handle_input(event: Event): void {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) {
			return;
		}

		search_value = target.value;
		is_open = true;
		active_index = 0;
	}

	function add_option(option_id: string): void {
		if (disabled || selected_ids.includes(option_id)) {
			return;
		}

		selected_ids = [...selected_ids, option_id];
		search_value = '';
		is_open = true;
		active_index = 0;
		onchange?.(selected_ids);
	}

	function remove_option(option_id: string): void {
		if (disabled) {
			return;
		}

		selected_ids = selected_ids.filter((selected_id) => selected_id !== option_id);
		onchange?.(selected_ids);
	}

	function handle_option_pointerdown(event: PointerEvent): void {
		event.preventDefault();
	}

	function handle_option_click(option_id: string): void {
		add_option(option_id);
		combobox_element?.focus();
	}

	function capture_combobox(element: HTMLInputElement): () => void {
		combobox_element = element;

		return () => {
			if (combobox_element === element) {
				combobox_element = undefined;
			}
		};
	}

	function handle_combobox_keydown(event: KeyboardEvent): void {
		switch (event.key) {
			case 'ArrowDown': {
				event.preventDefault();
				is_open = true;
				active_index = Math.min(active_index + 1, visible_options.length - 1);
				if (active_index < 0 && visible_options.length > 0) {
					active_index = 0;
				}
				break;
			}
			case 'ArrowUp': {
				event.preventDefault();
				is_open = true;
				active_index = active_index <= 0 ? visible_options.length - 1 : active_index - 1;
				break;
			}
			case 'Enter': {
				if (!is_open || !active_option) {
					break;
				}

				event.preventDefault();
				add_option(active_option.id);
				break;
			}
			case 'Escape': {
				if (is_open) {
					event.preventDefault();
					is_open = false;
					active_index = -1;
				}
				break;
			}
			case 'Backspace': {
				if (search_value === '' && selected_ids.length > 0) {
					remove_option(selected_ids.at(-1) ?? '');
				}
				break;
			}
			case 'Tab': {
				is_open = false;
				active_index = -1;
				break;
			}
		}
	}

	function open_listbox(): void {
		if (disabled) {
			return;
		}

		is_open = true;
		active_index = visible_options.length > 0 ? 0 : -1;
	}

	function handle_focusout(event: FocusEvent): void {
		const container = event.currentTarget;
		if (!(container instanceof HTMLDivElement)) {
			return;
		}

		if (!(event.relatedTarget instanceof Node) || !container.contains(event.relatedTarget)) {
			is_open = false;
			active_index = -1;
		}
	}
</script>

<div class="admin-field admin-multi-select" onfocusout={handle_focusout}>
	<label for={id}>{label}</label>
	<input
		{@attach capture_combobox}
		{id}
		type="search"
		role="combobox"
		value={search_value}
		{placeholder}
		{disabled}
		autocomplete="off"
		aria-autocomplete="list"
		aria-expanded={is_open}
		aria-controls={is_open ? listbox_id : undefined}
		aria-activedescendant={active_option_id}
		aria-describedby={selected_options.length > 0 ? selected_list_id : undefined}
		onfocus={open_listbox}
		oninput={handle_input}
		onkeydown={handle_combobox_keydown}
	/>

	{#if selected_options.length > 0}
		<ul id={selected_list_id} class="admin-multi-select-selected" aria-label="Selected options">
			{#each selected_options as selected_option (selected_option.id)}
				<li>
					<span>{selected_option.name}</span>
					<button
						type="button"
						data-intent="quiet"
						onclick={() => remove_option(selected_option.id)}
						{disabled}
						aria-label={`Remove ${selected_option.name}`}>×</button
					>
				</li>
			{/each}
		</ul>
	{/if}

	{#if name}
		{#each selected_ids as selected_id (selected_id)}
			<input type="hidden" {name} value={selected_id} />
		{/each}
	{/if}

	{#if is_open}
		<div
			id={listbox_id}
			class="admin-multi-select-options"
			role="listbox"
			aria-label={label}
			aria-multiselectable="true"
		>
			{#if filtered_options.length === 0}
				<p class="admin-multi-select-empty">No matches</p>
			{:else}
				{#each visible_options as option, option_index (option.id)}
					<button
						id={`${uid}-option-${option_index}`}
						type="button"
						role="option"
						tabindex="-1"
						aria-selected="false"
						aria-disabled={disabled}
						data-active={option_index === active_index}
						{disabled}
						onpointerdown={handle_option_pointerdown}
						onclick={() => handle_option_click(option.id)}
					>
						{option.name}
					</button>
				{/each}
			{/if}
		</div>
		{#if additional_match_count > 0}
			<p class="admin-multi-select-empty" role="status">
				{additional_match_count} more matches. Keep typing to narrow results.
			</p>
		{/if}
	{/if}
</div>
