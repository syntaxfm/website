<script lang="ts">
	import { tick } from 'svelte';

	interface Props {
		title: string;
		description: string;
		confirm_phrase?: string;
		action_label?: string;
		trigger_label?: string;
		onconfirm: () => void | Promise<void>;
	}

	const uid = $props.id();
	let {
		title,
		description,
		confirm_phrase = 'DELETE',
		action_label = 'Delete',
		trigger_label,
		onconfirm
	}: Props = $props();

	const title_id = `${uid}-title`;
	const description_id = `${uid}-description`;
	const input_id = `${uid}-confirmation`;
	let confirmation = $state('');
	let is_pending = $state(false);
	let error_message = $state('');
	let trigger_element: HTMLButtonElement | undefined;
	let dialog_element: HTMLDialogElement | undefined;
	let input_element: HTMLInputElement | undefined;
	let can_confirm = $derived(confirm_phrase.length > 0 && confirmation === confirm_phrase);
	let resolved_trigger_label = $derived(trigger_label ?? action_label);

	function capture_trigger(element: HTMLButtonElement): () => void {
		trigger_element = element;

		return () => {
			if (trigger_element === element) {
				trigger_element = undefined;
			}
		};
	}

	function capture_dialog(element: HTMLDialogElement): () => void {
		dialog_element = element;

		return () => {
			if (dialog_element === element) {
				dialog_element = undefined;
			}
		};
	}

	function capture_input(element: HTMLInputElement): () => void {
		input_element = element;

		return () => {
			if (input_element === element) {
				input_element = undefined;
			}
		};
	}

	function open_dialog(): void {
		if (!dialog_element || dialog_element.open) {
			return;
		}

		confirmation = '';
		error_message = '';
		dialog_element.showModal();
		input_element?.focus();
	}

	function close_dialog(): void {
		if (!is_pending && dialog_element?.open) {
			dialog_element.close();
		}
	}

	function handle_cancel(event: Event): void {
		if (is_pending) {
			event.preventDefault();
		}
	}

	function handle_close(): void {
		confirmation = '';
		error_message = '';
		restore_focus();
	}

	function get_page_focus_target(): HTMLElement | undefined {
		const main_element = document.querySelector<HTMLElement>('main, [role="main"]');
		const main_heading = main_element?.querySelector<HTMLElement>(
			'h1, [role="heading"][aria-level="1"]'
		);

		return (
			main_heading ??
			main_element ??
			document.querySelector<HTMLElement>('h1, [role="heading"][aria-level="1"]') ??
			undefined
		);
	}

	function restore_focus(preferred_trigger = trigger_element): void {
		if (preferred_trigger?.isConnected) {
			preferred_trigger.focus();
			return;
		}

		const page_focus_target = get_page_focus_target();
		if (!page_focus_target) {
			return;
		}

		if (!page_focus_target.hasAttribute('tabindex')) {
			page_focus_target.tabIndex = -1;
		}
		page_focus_target.focus();
	}

	async function handle_submit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (!can_confirm || is_pending) {
			return;
		}

		is_pending = true;
		error_message = '';
		const action_trigger = trigger_element;

		try {
			await onconfirm();
			is_pending = false;
			if (dialog_element?.isConnected && dialog_element.open) {
				dialog_element.close();
			}
			await tick();
			restore_focus(action_trigger);
		} catch (error) {
			console.error('Admin confirmation action failed', error);
			is_pending = false;
			error_message = 'Action failed. Try again.';
		}
	}
</script>

<button type="button" data-intent="danger" {@attach capture_trigger} onclick={open_dialog}
	>{resolved_trigger_label}</button
>

<dialog
	class="admin-danger"
	data-state={is_pending ? 'pending' : 'idle'}
	aria-labelledby={title_id}
	aria-describedby={description_id}
	aria-busy={is_pending}
	{@attach capture_dialog}
	oncancel={handle_cancel}
	onclose={handle_close}
>
	<form class="stack" onsubmit={handle_submit}>
		<h2 id={title_id}>{title}</h2>
		<p id={description_id}>{description}</p>

		<div class="admin-field">
			<label for={input_id}>Type <strong>{confirm_phrase}</strong> to confirm</label>
			<input
				id={input_id}
				name="confirmation"
				type="text"
				autocomplete="off"
				spellcheck={false}
				disabled={is_pending}
				{@attach capture_input}
				bind:value={confirmation}
			/>
		</div>

		{#if error_message}
			<p class="admin-feedback" data-tone="negative" role="alert">{error_message}</p>
		{/if}

		<div class="admin-actions">
			<button type="button" data-intent="quiet" disabled={is_pending} onclick={close_dialog}
				>Cancel</button
			>
			<button type="submit" data-intent="danger" disabled={!can_confirm || is_pending}>
				{is_pending ? 'Working…' : action_label}
			</button>
		</div>
	</form>
</dialog>
