<script lang="ts">
	import Dot from '$lib/utilities/Dot.svelte';
	import { get_id_from_url, get_thumbnail_from_id } from '$lib/videos/utils';
	import get_show_path from '$utilities/slug';
	import no_thumb from './no_thumb.png';

	interface Props {
		show: {
			title: string;
			date: Date | string;
			show: string;
			thumbnail?: string | null;
			youtube_url?: string | null;
			number: number;
			slug: string;
		};
		type: 'grid' | 'list';
		href?: string;
		onselect?: () => void;
		data_has_node?: boolean;
		preload_data?: boolean;
	}

	let { show, type, href, onselect, data_has_node = false, preload_data = false }: Props = $props();
	let youtube_video_id = $derived(show.youtube_url ? get_id_from_url(show.youtube_url) : '');
	let thumbnail_src = $derived(
		(youtube_video_id ? get_thumbnail_from_id(youtube_video_id) : '') || show.thumbnail || no_thumb
	);
	let show_href = $derived(href || get_show_path(show));
	let show_date = $derived(show.date instanceof Date ? show.date : new Date(show.date));
	let formatted_date = $derived(
		show_date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	);
</script>

<a
	class="show-link"
	href={show_href}
	onclick={onselect}
	data-has-node={data_has_node ? true : undefined}
	data-sveltekit-preload-data={preload_data ? '' : undefined}
>
	<article
		class={[type === 'list' ? 'flex bg-shade-or-tint-light show-list-view' : 'show-grid-view']}
	>
		<div>
			<img
				class={[type === 'list' ? 'br-small' : 'br-medium']}
				style={type === 'list' ? 'width: 135px;' : 'width: 100%'}
				src={thumbnail_src}
				alt={show.title}
			/>
		</div>
		<div class={['stack', type === 'grid' && 'stack-reverse']} style:--stack-gap="0.5rem">
			<h3 class="fs-body fv-700-i">{show.title}</h3>
			<div class="flex">
				{#if type === 'list'}
					<p class="fs-caption">
						{formatted_date}
					</p>
				{/if}
				<Dot color="var(--c-primary)" />
				<p class="fs-caption">{show.show}</p>
				<p class="fs-caption">{show.number}</p>
			</div>
		</div>
	</article>
</a>

<style>
	.show-list-view {
		border-radius: var(--br-medium);
		padding: 8px;
	}

	.show-link {
		color: inherit;
		display: block;
		text-decoration: none;
	}

	.show-grid-view {
		max-width: 300px;

		img {
			margin-bottom: 0.5rem;
		}
	}

	.flex {
		align-items: center;
	}
</style>
