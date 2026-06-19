<script lang="ts">
	import { humanize_enum } from '$lib/utils/format_enum';

	interface Props {
		status: string | null | undefined;
	}

	let { status }: Props = $props();

	// Map the finite set of content/submission statuses to a visual tone. Unknown
	// values fall back to neutral so new statuses still render as a readable chip.
	const TONE_BY_STATUS: Record<string, 'positive' | 'neutral' | 'muted' | 'negative'> = {
		PUBLISHED: 'positive',
		APPROVED: 'positive',
		COMPLETED: 'positive',
		DRAFT: 'neutral',
		PENDING: 'neutral',
		ARCHIVED: 'muted',
		REJECTED: 'negative'
	};

	let tone = $derived(status ? (TONE_BY_STATUS[status] ?? 'neutral') : 'neutral');
</script>

{#if status}
	<span class="status-badge" data-tone={tone}>{humanize_enum(status)}</span>
{:else}
	<span class="status-empty">-</span>
{/if}

<style lang="postcss">
	/* Custom chip: no shared chip primitive exists in this repo's style system,
	   so this is the single justified status-pill. Tinted background carries the
	   semantic; text stays --c-fg for guaranteed contrast in both themes. */
	.status-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: var(--br-small);
		font-size: var(--fs-1);
		white-space: nowrap;
		color: var(--c-fg);
		background: var(--c-fg-1);
	}

	.status-badge[data-tone='positive'] {
		background: var(--c-green-3);
	}

	.status-badge[data-tone='negative'] {
		background: var(--c-red-3);
	}

	.status-badge[data-tone='muted'] {
		background: var(--c-fg-05);
		color: color-mix(in oklch, var(--c-fg) 60%, transparent);
	}

	.status-empty {
		color: color-mix(in oklch, var(--c-fg) 50%, transparent);
	}
</style>
