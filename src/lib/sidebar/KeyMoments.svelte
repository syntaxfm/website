<script lang="ts">
	import { resolve } from '$app/paths';
	import Icon from '#lib/Icon.svelte';
	import { topic_anchor } from '#lib/transcript/utils.ts';
	import format_time, { tsToS } from '$utilities/format_time';
	import SidebarTitle from './SidebarTitle.svelte';
	import type { KeyMomentRow } from '#lib/seo/hubs.ts';

	let { moments }: { moments: KeyMomentRow[] } = $props();
</script>

<!-- A topic page's links into the transcripts, laid out like Most Popular -->
<div>
	<SidebarTitle title="_KEY_MOMENTS()" />
	<div class="key-moments stack">
		{#each moments as moment (moment.show_number)}
			<a
				class="key-moment"
				href="{resolve('/(site)/show/[show_number]/[slug]/transcript', {
					show_number: String(moment.show_number),
					slug: moment.show_slug
				})}#{topic_anchor(moment.text)}"
			>
				<span class="marker"><Icon name="play" width={12} height={12} aria_hidden={true} /></span>
				<strong class="fv-700-i">{moment.text}</strong>
				<!-- 00:57:04 reads as 57:04, as the transcript shows it -->
				<span class="episode"
					><span class="time">{format_time(tsToS(moment.time))}</span> · #{moment.show_number}
					{moment.show_title}</span
				>
			</a>
		{/each}
	</div>
</div>

<style>
	.key-moments {
		position: relative;
		gap: 24px;

		/* The same rail as Most Popular */
		&::before {
			content: '';
			display: block;
			width: 2px;
			height: 100%;
			background-color: var(--c-fg-1);
			position: absolute;
			left: 15px;
			top: 0;
			z-index: -1;
		}
	}

	/* Marker in its own column; the moment and its episode beside it */
	.key-moment {
		display: grid;
		grid-template-columns: 32px 1fr;
		gap: 4px 20px;
		align-items: center;
		color: inherit;
		text-decoration: none;
	}

	.marker {
		grid-row: 1;
		align-self: start;

		/* Centered on the moment's first line (17px × 1.3) */
		margin-top: calc((var(--fs-3) * 1.3 - 32px) / 2);
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		background: var(--c-primary);
		color: var(--c-black);
		border-radius: 32px;
	}

	strong {
		grid-column: 2;
		font-size: var(--fs-3);
		line-height: 1.3;

		.key-moment:hover & {
			text-decoration: underline;
		}
	}

	/* Potluck titles run four topics long */
	.episode {
		grid-column: 2;
		font-size: var(--fs-2);
		line-height: 1.4;
		color: var(--c-fg-7);
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
	}

	.time {
		color: var(--c-fg);
		font-variant-numeric: tabular-nums;
	}
</style>
