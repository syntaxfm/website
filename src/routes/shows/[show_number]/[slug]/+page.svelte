<script lang="ts">
	import { format } from 'date-fns';
	import type { PageData } from './$types';
	import { player } from '$state/player';
	import HostsAndGuests from './HostsAndGuests.svelte';

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
			<svg width="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					opacity="0.1"
					d="M4 5.49683V18.5032C4 20.05 5.68077 21.0113 7.01404 20.227L18.0694 13.7239C19.384 12.9506 19.384 11.0494 18.0694 10.2761L7.01404 3.77296C5.68077 2.98869 4 3.95 4 5.49683Z"
					fill="var(--white)"
				/>
				<path
					d="M4 5.49683V18.5032C4 20.05 5.68077 21.0113 7.01404 20.227L18.0694 13.7239C19.384 12.9506 19.384 11.0494 18.0694 10.2761L7.01404 3.77296C5.68077 2.98869 4 3.95 4 5.49683Z"
					stroke="var(--button-color)"
					stroke-width="4"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			Play Episode {show.number}</button
		>
	</header>

	<HostsAndGuests guests={show.guest} />

	<div class="show-actions">
		<a class="a" download href={show.url}>Download Show</a>
		<a
			class="a"
			download
			href={'https://github.com/syntaxfm/website/tree/main/shows' + show.md_file}>Edit Show Notes</a
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
