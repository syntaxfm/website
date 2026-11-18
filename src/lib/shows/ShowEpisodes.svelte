<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { get_media_key } from '$state/player_utils';
	import Show from './Show.svelte';

	type Props = {
		type: 'grid' | 'list';
		// Episodes, and on /videos the videos that aren't one
		shows: ComponentProps<typeof Show>['show'][];
	};

	let { type, shows }: Props = $props();
</script>

<ul class={type === 'grid' ? 'grid show-episodes' : 'stack show-episodes'}>
	{#each shows as show (get_media_key(show))}
		<li>
			<Show {show} {type} />
		</li>
	{/each}
</ul>

<style>
	.show-episodes {
		li {
			list-style: none;
		}

		list-style: none;
		margin: 0;
		padding: 0;

		--stack-gap: 1rem;
	}
</style>
