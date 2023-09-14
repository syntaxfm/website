<script lang="ts">
	import { format } from 'date-fns';
	import { player } from '$state/player';
	import { page } from '$app/stores';
	import HostsAndGuests from './HostsAndGuests.svelte';
	import Icon from '$lib/Icon.svelte';
	import NewsletterForm from '$lib/NewsletterForm.svelte';
	import Transcript from '$lib/transcript/Transcript.svelte';
	export let data;
	$: ({ show } = data);

	async function handleClick(e: Event) {
		const { target } = e;
		if (target instanceof HTMLAnchorElement && target.matches(`a[href*='#t=']`)) {
			console.log('click');
			e.preventDefault();
			const { href } = target;
			player.update_time(href, show);
		}
	}
</script>

<header>
	<p class="show-page-date" style:--transition-name="show-date-{show.number}">
		{format(new Date(show.date), 'MMMM do, yyyy')}
	</p>
	<h1 style:--transition-name="show-title-{show.number}">{show.title}</h1>
	<p>
		{#each show.aiShowNote?.topics?.slice(0, 5) || [] as topic}
			<span class="topic">#{topic.name}</span>
		{/each}
	</p>
	<button class="big play" on:click={() => player.play_show(show)}>
		<Icon name="play" />
		Play Episode {show.number}</button
	>
</header>

<div>
	<HostsAndGuests guests={show.guests} />
</div>

<div class="show-actions">
	<a class="button subtle" download href={show.url}>👇 Download Show</a>
	<a
		class="subtle button"
		download
		href={'https://github.com/syntaxfm/website/tree/main/shows' + show.md_file}
		>✏️ Edit Show Notes</a
	>
</div>

<div class="tabs">
	<a data-sveltekit-noscroll href="/shows/{$page.params.show_number}/{$page.params.slug}"
		>Show Notes</a
	>
	<a data-sveltekit-noscroll href="/shows/{$page.params.show_number}/{$page.params.slug}/transcript"
		>Transcript</a
	>
</div>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<section class="layout full" on:click={handleClick}>
	{#if $page.params.tab === 'transcript'}
		<Transcript aiShowNote={show.aiShowNote} transcript={show.transcript} />
	{:else}
		<div class="main">
			{@html show.show_notes}
			<div class="sidebar">
				<div class="sticky">
					<NewsletterForm />
				</div>
			</div>
		</div>
	{/if}
</section>

<style lang="postcss">
	@layer theme {
		:global(.layout > *) {
			grid-column: start / end;
			@media (--above_med) {
				grid-column: main / main-end;
			}
		}
	}

	header {
		grid-column: content / content-end;
	}

	h1 {
		view-transition-name: var(--transition-name);
		margin-top: 0;
		margin-bottom: 6rem;
		font-size: var(--font-size-xxl);
	}

	.show-actions {
		grid-column: content / content-end;
		padding: 2rem 0;
		margin-bottom: 2rem;
		border-top: var(--border);
		border-bottom: var(--border);
		font-weight: 700;
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		@media (--below_med) {
			a {
				width: 100%;
			}
		}
	}

	.show-page-date {
		view-transition-name: var(--transition-name);
	}
</style>
