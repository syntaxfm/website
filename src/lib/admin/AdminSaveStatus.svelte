<script lang="ts">
	import type { AutosaveState } from '$lib/utils/autosave.svelte';

	interface Props {
		state: AutosaveState;
		error_message?: string;
		onretry?: () => void | Promise<void>;
	}

	let { state, error_message = '', onretry }: Props = $props();

	let message = $derived(
		state === 'dirty'
			? 'Unsaved changes'
			: state === 'saving'
				? 'Saving…'
				: state === 'saved'
					? 'Saved'
					: state === 'error'
						? error_message || 'Unable to save changes.'
						: ''
	);
	let tone = $derived(state === 'saved' ? 'positive' : state === 'error' ? 'negative' : undefined);
</script>

{#if state !== 'idle'}
	<div
		class="admin-feedback admin-control-row"
		data-state={state}
		data-tone={tone}
		role={state === 'error' ? 'alert' : 'status'}
	>
		<span>{message}</span>
		{#if state === 'error' && onretry}
			<button type="button" data-intent="quiet" onclick={onretry}>Retry</button>
		{/if}
	</div>
{/if}
