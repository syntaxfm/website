<script lang="ts">
	import { format } from 'date-fns';
	import type { PageData } from './$types';
	import { player } from '$state/player';
	import HostsAndGuests from './HostsAndGuests.svelte';

	export let data: PageData;
	$: ({ show } = data);
	$: console.log('show', show);
</script>

<div class="show-page">
	<p>{format(new Date(show.date), 'MMMM do, yyyy')}</p>
	<h1>{show.title}</h1>
	<button on:click={() => player.play_show(show)}>Play Episode {show.number}</button>

	<HostsAndGuests guests={show.guest} />

	<div class="show-actions">
		<a download href={show.url}>Download Show</a>
		<a download href={'https://github.com/syntaxfm/website/tree/main/shows' + show.md_file}
			>Edit Show Notes</a
		>
	</div>

	{@html show.show_notes}
</div>

<style>
	.show-page {
		display: grid;
		grid-template-columns:
			[start content] minmax(0, 12.6fr) [content gap] minmax(0, 1fr) [gap sidebar] minmax(0, 5fr)
			[sidebar end];
	}

	:global(.show-page > *) {
		grid-column: content/content;
	}

	h1 {
		margin-top: 0;
		grid-column: start/end;
	}

	.show-actions {
		grid-column: start/end;
		padding: 2rem 0;
		margin-bottom: 2rem;
		border-top: 2px solid var(--black-2);
		border-bottom: 2px solid var(--black-2);
	}
</style>
