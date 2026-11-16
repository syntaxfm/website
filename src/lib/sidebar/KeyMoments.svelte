<script lang="ts">
	import { resolve } from '$app/paths';
	import { topic_anchor } from '#lib/transcript/utils.ts';
	import format_time, { tsToS } from '$utilities/format_time';
	import SidebarTitle from './SidebarTitle.svelte';
	import type { KeyMomentRow } from '#lib/seo/hubs.ts';

	let { moments }: { moments: KeyMomentRow[] } = $props();
</script>

<!-- A topic page's links into the transcripts, laid out like Most Popular -->
<div>
	<SidebarTitle title="_KEY_MOMENTS()" />
	<ol class="key-moments stack">
		{#each moments as moment (moment.show_number)}
			<li>
				<a
					class="flex key-moment"
					href="{resolve('/(site)/show/[show_number]/[slug]/transcript', {
						show_number: String(moment.show_number),
						slug: moment.show_slug
					})}#{topic_anchor(moment.text)}"
				>
					<!-- 00:57:04 reads as 57:04, as the transcript shows it -->
					<span class="time fs-caption">{format_time(tsToS(moment.time))}</span>
					<span class="stack key-moment-info">
						<span class="fs-caption">#{moment.show_number} – {moment.show_title}</span>
						<strong class="fs-body fv-700-i">{moment.text}</strong>
					</span>
				</a>
			</li>
		{/each}
	</ol>
</div>

<style>
	.key-moments {
		--time-width: 64px;

		position: relative;
		gap: 20px;
		margin: 0;
		padding: 0;
		list-style: none;

		/* The same rail as Most Popular, through the middle of the times */
		&::before {
			content: '';
			display: block;
			width: 2px;
			height: 100%;
			background-color: var(--c-fg-1);
			position: absolute;
			left: calc(var(--time-width) / 2 - 1px);
			top: 0;
			z-index: -1;
		}
	}

	.key-moment {
		gap: 20px;
		align-items: start;
		color: inherit;
		text-decoration: none;

		&:hover strong {
			text-decoration: underline;
		}
	}

	.key-moment-info {
		gap: 5px;
	}

	.time {
		flex-shrink: 0;
		width: var(--time-width);
		padding-block: 6px;
		text-align: center;
		font-variant-numeric: tabular-nums;
		background: var(--c-primary);
		color: var(--c-black);
		border-radius: 32px;
	}
</style>
