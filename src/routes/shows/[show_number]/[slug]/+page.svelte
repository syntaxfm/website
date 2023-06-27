<script lang="ts">
	import { format } from 'date-fns';
	import type { PageData } from './$types';
	import { player } from '$state/player';
	import HostsAndGuests from './HostsAndGuests.svelte';
	import Icon from '$lib/Icon.svelte';

	export let data: PageData;
	$: ({ show } = data);
</script>

<article class="show-page">
	<header>
		<p class="show-page-date" style:--transition-name="show-date-{show.number}">
			{format(new Date(show.date), 'MMMM do, yyyy')}
		</p>
		<h1 style:--transition-name="show-title-{show.number}">{show.title}</h1>

		<button class="big play" on:click={() => player.play_show(show)}>
			<Icon name="play" />
			Play Episode {show.number}</button
		>
	</header>

	<HostsAndGuests guests={show.guests} />

	<div class="show-actions">
		<a class="button subtle" download href={show.url}>👇 Download Show</a>
		<a
			class="subtle button"
			download
			href={'https://github.com/syntaxfm/website/tree/main/shows' + show.md_file}
			>✏️ Edit Show Notes</a
		>
	</div>

	{@html show.show_notes}
</article>

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

	header {
		grid-column: start/end;
	}

	h1 {
		view-transition-name: var(--transition-name);
		margin-top: 0;
		margin-bottom: 6rem;
		font-size: var(--font-size-xxl);
	}

	.show-actions {
		grid-column: start/end;
		padding: 2rem 0;
		margin-bottom: 2rem;
		border-top: 2px solid var(--black-2);
		border-bottom: 2px solid var(--black-2);
		font-weight: 700;
	}

	.show-page-date {
		view-transition-name: var(--transition-name);
	}
</style>
