<script lang="ts">
	import { tick } from 'svelte';
	import { processor } from '$utilities/markdown';

	interface Props {
		value?: string;
		label?: string;
		rows?: number;
		id?: string;
		onchange?: (next_value: string) => void;
	}

	const uid = $props.id();
	let {
		value = $bindable(''),
		label = 'Body',
		rows = 16,
		id = `${uid}-input`,
		onchange
	}: Props = $props();
	const edit_tab_id = `${uid}-edit-tab`;
	const preview_tab_id = `${uid}-preview-tab`;
	const edit_panel_id = `${uid}-edit-panel`;
	const preview_panel_id = `${uid}-preview-panel`;

	type EditorTab = 'edit' | 'preview';

	let active_tab = $state<EditorTab>('edit');
	let preview_html = $state('');
	let preview_failed = $state(false);
	let render_token = 0;
	let textarea_element: HTMLTextAreaElement | null = null;

	function capture_textarea(element: HTMLTextAreaElement): () => void {
		textarea_element = element;

		return () => {
			if (textarea_element === element) {
				textarea_element = null;
			}
		};
	}

	async function render_preview(markdown_value: string) {
		const current_token = ++render_token;

		try {
			const rendered = await processor.process(markdown_value);
			if (current_token !== render_token) {
				return;
			}

			preview_html = String(rendered);
			preview_failed = false;
		} catch {
			if (current_token !== render_token) {
				return;
			}

			preview_html = '';
			preview_failed = true;
		}
	}

	async function insert_markdown(prefix: string, suffix = '', placeholder = 'text') {
		if (!textarea_element) {
			value = `${value}${prefix}${placeholder}${suffix}`;
			onchange?.(value);
			if (active_tab === 'preview') {
				void render_preview(value);
			}
			return;
		}

		const selection_start = textarea_element.selectionStart;
		const selection_end = textarea_element.selectionEnd;
		const has_selection = selection_end > selection_start;
		const selection_text = value.slice(selection_start, selection_end);
		const content_text = has_selection ? selection_text : placeholder;

		value =
			value.slice(0, selection_start) + prefix + content_text + suffix + value.slice(selection_end);
		onchange?.(value);

		const next_cursor_position = selection_start + prefix.length + content_text.length;

		await tick();
		textarea_element.focus();
		textarea_element.setSelectionRange(next_cursor_position, next_cursor_position);

		if (active_tab === 'preview') {
			void render_preview(value);
		}
	}

	function open_edit_tab(): void {
		active_tab = 'edit';
	}

	function open_preview_tab(): void {
		active_tab = 'preview';
		void render_preview(value);
	}

	function handle_editor_input(): void {
		onchange?.(value);
	}

	async function handle_tab_keydown(event: KeyboardEvent): Promise<void> {
		if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
			return;
		}
		const tablist = event.currentTarget;
		if (!(tablist instanceof HTMLDivElement)) {
			return;
		}

		event.preventDefault();
		const should_open_preview =
			event.key === 'End' ||
			((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && active_tab === 'edit');
		const should_open_edit =
			event.key === 'Home' ||
			((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && active_tab === 'preview');

		if (should_open_preview) {
			open_preview_tab();
		} else if (should_open_edit) {
			open_edit_tab();
		}

		await tick();
		tablist.querySelector<HTMLButtonElement>('[role="tab"][tabindex="0"]')?.focus();
	}

	function make_h2() {
		void insert_markdown('## ', '', 'Heading');
	}

	function make_bold() {
		void insert_markdown('**', '**', 'bold text');
	}

	function make_italic() {
		void insert_markdown('*', '*', 'italic text');
	}

	function make_link() {
		void insert_markdown('[', '](https://example.com)', 'link text');
	}

	function make_list_item() {
		void insert_markdown('- ', '', 'List item');
	}
</script>

<div class="admin-field admin-markdown-editor">
	<label for={id}>{label}</label>

	<div class="admin-toolbar" role="toolbar" aria-label="Markdown formatting">
		<button type="button" onclick={make_h2} title="Insert heading level two">Heading</button>
		<button type="button" onclick={make_bold} title="Insert bold markdown">Bold</button>
		<button type="button" onclick={make_italic} title="Insert italic markdown">Italic</button>
		<button type="button" onclick={make_link} title="Insert link markdown">Link</button>
		<button type="button" onclick={make_list_item} title="Insert unordered list item">List</button>
	</div>

	<div
		class="admin-tabs"
		role="tablist"
		aria-label="Markdown editor mode"
		tabindex="-1"
		onkeydown={handle_tab_keydown}
	>
		<button
			id={edit_tab_id}
			type="button"
			role="tab"
			aria-selected={active_tab === 'edit'}
			aria-controls={edit_panel_id}
			tabindex={active_tab === 'edit' ? 0 : -1}
			onclick={open_edit_tab}
		>
			Edit
		</button>
		<button
			id={preview_tab_id}
			type="button"
			role="tab"
			aria-selected={active_tab === 'preview'}
			aria-controls={preview_panel_id}
			tabindex={active_tab === 'preview' ? 0 : -1}
			onclick={open_preview_tab}
		>
			Preview
		</button>
	</div>

	{#if active_tab === 'edit'}
		<div
			id={edit_panel_id}
			class="admin-editor-panel"
			role="tabpanel"
			aria-labelledby={edit_tab_id}
		>
			<textarea
				{id}
				{@attach capture_textarea}
				bind:value
				{rows}
				spellcheck={false}
				oninput={handle_editor_input}></textarea>
		</div>
	{:else}
		<div
			id={preview_panel_id}
			class="admin-editor-panel admin-markdown-preview"
			role="tabpanel"
			aria-labelledby={preview_tab_id}
			aria-live="polite"
			tabindex="0"
		>
			{#if preview_failed}
				<pre>{value}</pre>
			{:else}
				<iframe
					class="admin-markdown-preview-frame"
					title="Markdown preview"
					srcdoc={preview_html}
					sandbox=""
				></iframe>
			{/if}
		</div>
	{/if}
</div>
