<script lang="ts">
	import { resolve } from '$app/paths';
	import Icon from '#lib/Icon.svelte';
	import { topic_anchor } from '#lib/transcript/utils.ts';
	import format_time, { tsToS } from '$utilities/format_time';
	import SidebarTitle from './SidebarTitle.svelte';
	import type { KeyMomentRow } from '#lib/seo/hubs.ts';

	let { moments }: { moments: KeyMomentRow[] } = $props();
</script>

<!-- A topic page's links into the transcripts, built like a Most Popular item -->
<div>
	<SidebarTitle title="_KEY_MOMENTS()" />
	<ul class="key-moments stack">
		{#each moments as moment (moment.show_number)}
			<li>
				<a
					class="flex key-moment"
					href="{resolve('/(site)/show/[show_number]/[slug]/transcript', {
						show_number: String(moment.show_number),
						slug: moment.show_slug
					})}#{topic_anchor(moment.text)}"
				>
					<span class="marker"><Icon name="play" width={12} height={12} aria_hidden={true} /></span>
					<span class="stack key-moment-info">
						<strong class="fs-body fv-700-i">{moment.text}</strong>
						<span class="fs-caption episode">#{moment.show_number} – {moment.show_title}</span>
						<!-- 00:57:04 reads as 57:04, as the transcript shows it -->
						<span class="fs-micro">{format_time(tsToS(moment.time))}</span>
					</span>
				</a>
			</li>
		{/each}
	</ul>
</div>

<style>
	.key-moments {
		position: relative;
		gap: 20px;
		margin: 0;
		padding: 0;
		list-style: none;

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

	.key-moment {
		gap: 20px;
		color: inherit;
		text-decoration: none;

		&:hover strong {
			text-decoration: underline;
		}
	}

	.key-moment-info {
		gap: 5px;
	}

	/* Potluck titles run four topics long */
	.episode {
		color: var(--c-fg-7);
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
	}

	.marker {
		flex-shrink: 0;
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		background: var(--c-primary);
		color: var(--c-black);
		border-radius: 32px;
	}

	.fs-micro {
		font-variant-numeric: tabular-nums;
	}
</style>
