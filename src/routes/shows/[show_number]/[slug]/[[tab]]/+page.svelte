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
	<a
		data-sveltekit-noscroll
		class:active={$page.url.pathname === `/shows/${$page.params.show_number}/${$page.params.slug}`}
		href="/shows/{$page.params.show_number}/{$page.params.slug}">Show Notes</a
	>
	<a
		class:active={$page.url.pathname.includes(
			`/shows/${$page.params.show_number}/${$page.params.slug}/transcript`
		)}
		data-sveltekit-noscroll
		href="/shows/{$page.params.show_number}/{$page.params.slug}/transcript">Transcript</a
	>
</div>

<!-- I don't feel great about this one, but it's hard, because these are click targets on show notes coming in from markdown -->
<!-- I have no idea how we would make those timestamps into click targets correctly, maybe we can dynamically add role="button" -->
<!-- Please submit a PR if you have a good fix here :) - Scott -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<section class="layout full" on:click={handleClick}>
	{#if $page.params.tab === 'transcript'}
		<Transcript aiShowNote={show.aiShowNote} transcript={show.transcript} />
	{:else}
		<div class="main">
			{@html show.show_notes}
		</div>

		<div class="sidebar">
			<div
				class="sticky zone"
				style="border: solid 0.5px var(--black-1)"
				style:--radius="20px"
				style:--bg="var(--bg-1)"
			>
				<NewsletterForm />
			</div>
		</div>
	{/if}
</section>

<style lang="postcss">
	@layer theme {
		header {
			grid-column: content / content;
		}

		h1 {
			view-transition-name: var(--transition-name);
			margin-top: 0;
			margin-bottom: 6rem;
			font-size: var(--font-size-xxl);
		}

		.show-actions {
			grid-column: content / content;
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

		.tabs {
			margin-bottom: 1rem;
			display: flex;
			gap: 20px;
			a {
				color: var(--fg);
				&.active,
				&:hover {
					color: var(--color-sheet);
					text-decoration: underline;
					text-decoration-color: var(--primary);
					text-decoration-thickness: 2px;
				}
			}
		}
	}
</style>
