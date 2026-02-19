<script lang="ts">
	import { tick } from 'svelte';
	import { processor } from '$utilities/markdown';

	interface Props {
		value?: string;
		label?: string;
		rows?: number;
	}

	let { value = $bindable(''), label = 'Body', rows = 16 }: Props = $props();

	type EditorTab = 'edit' | 'preview';

	let active_tab = $state<EditorTab>('edit');
	let preview_html = $state('');
	let preview_failed = $state(false);
	let render_token = 0;
	let textarea_element = $state<HTMLTextAreaElement | null>(null);

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

		const next_cursor_position = selection_start + prefix.length + content_text.length;

		await tick();
		textarea_element.focus();
		textarea_element.setSelectionRange(next_cursor_position, next_cursor_position);

		if (active_tab === 'preview') {
			void render_preview(value);
		}
	}

	function open_edit_tab() {
		active_tab = 'edit';
	}

	function open_preview_tab() {
		active_tab = 'preview';
		void render_preview(value);
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

<div class="stack" style:--stack-gap="var(--pad-small)">
	<label for="markdown-editor-input" class="fs-2">{label}</label>

	<div
		class="flex"
		style:--flex-gap="var(--pad-xsmall)"
		role="toolbar"
		aria-label="Markdown formatting"
	>
		<button type="button" onclick={make_h2} aria-label="Insert heading level two">H2</button>
		<button type="button" onclick={make_bold} aria-label="Insert bold markdown">Bold</button>
		<button type="button" onclick={make_italic} aria-label="Insert italic markdown">Italic</button>
		<button type="button" onclick={make_link} aria-label="Insert link markdown">Link</button>
		<button type="button" onclick={make_list_item} aria-label="Insert unordered list item"
			>UL</button
		>
	</div>

	<div
		class="flex"
		style:--flex-gap="var(--pad-xsmall)"
		role="tablist"
		aria-label="Markdown editor mode"
	>
		<button type="button" role="tab" aria-selected={active_tab === 'edit'} onclick={open_edit_tab}>
			Edit
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={active_tab === 'preview'}
			onclick={open_preview_tab}
		>
			Preview
		</button>
	</div>

	{#if active_tab === 'edit'}
		<textarea
			id="markdown-editor-input"
			bind:this={textarea_element}
			bind:value
			{rows}
			spellcheck={false}
		></textarea>
	{:else}
		<div aria-live="polite">
			{#if preview_failed}
				<pre>{value}</pre>
			{:else}
				<!-- svelte-ignore html -->
				{@html preview_html}
			{/if}
		</div>
	{/if}
</div>
