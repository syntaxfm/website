<script lang="ts">
	interface Props {
		// The selected area (or the screen); null until it's taken, or when it couldn't be
		preview_url: string | null;
		// The screenshot is still being taken
		is_shooting?: boolean;
		request?: string;
		error_message?: string;
		onsubmit: (request: string) => void;
		oncancel: () => void;
	}

	let {
		preview_url,
		is_shooting = false,
		request = $bindable(''),
		error_message = '',
		onsubmit,
		oncancel
	}: Props = $props();

	const uid = $props.id();
	let is_empty = $derived(request.trim().length === 0);

	// Open from the start: the dialog only exists while a report is being written
	function show_modal(dialog: HTMLDialogElement) {
		dialog.showModal();
		return () => dialog.close();
	}

	function handle_submit(event: SubmitEvent) {
		event.preventDefault();
		if (!is_empty) onsubmit(request.trim());
	}

	function handle_cancel(event: Event) {
		event.preventDefault();
		oncancel();
	}

	function submit_on_shortcut(event: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) {
		if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			event.currentTarget.form?.requestSubmit();
		}
	}
</script>

<dialog
	class="admin issue-report-dialog"
	aria-labelledby="{uid}-label"
	{@attach show_modal}
	oncancel={handle_cancel}
>
	<form class="stack" onsubmit={handle_submit}>
		{#if preview_url}
			<img src={preview_url} alt="Selected area" />
		{:else if is_shooting}
			<div class="shooting" role="status" aria-label="Taking the screenshot"></div>
		{/if}

		<div class="admin-field">
			<label id="{uid}-label" for="{uid}-request">What needs to change?</label>
			<textarea
				id="{uid}-request"
				name="request"
				required
				maxlength="5000"
				bind:value={request}
				onkeydown={submit_on_shortcut}></textarea>
		</div>

		{#if error_message}
			<p class="admin-feedback" data-tone="negative" role="alert">{error_message}</p>
		{/if}

		<div class="admin-actions">
			<button type="button" data-intent="quiet" onclick={oncancel}>Cancel</button>
			<button type="submit" data-intent="primary" disabled={is_empty}>File issue</button>
		</div>
	</form>
</dialog>

<style>
	.issue-report-dialog {
		width: min(40rem, calc(100% - var(--pad-xlarge)));
		max-width: none;
		max-height: calc(100dvh - var(--pad-xlarge));
		margin: auto;
		padding: var(--pad-large);
		background-color: var(--c-bg);
		border: 1px solid var(--c-fg-2);
		border-radius: var(--br-small);
		box-shadow: var(--s-graphic-medium);

		&::backdrop {
			background-color: var(--c-black-6);
		}
	}

	img,
	.shooting {
		display: block;
		width: 100%;
		max-height: 40dvh;
		object-fit: contain;
		background-color: var(--c-fg-05);
		border: 1px solid var(--c-fg-2);
		border-radius: var(--br-small);
	}

	/* Where the screenshot will be, pulsing until the server has taken it */
	.shooting {
		height: 12rem;
		animation: shooting 1.2s ease-in-out infinite alternate;
	}

	@keyframes shooting {
		to {
			background-color: var(--c-fg-1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.shooting {
			animation: none;
		}
	}

	textarea {
		min-height: 8rem;
	}
</style>
