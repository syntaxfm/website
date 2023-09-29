<script lang="ts">
	import { format } from 'date-fns';
	import { player } from '$state/player';
	import { page } from '$app/stores';
	import HostsAndGuests from './HostsAndGuests.svelte';
	import Icon from '$lib/Icon.svelte';
	import NewsletterForm from '$lib/NewsletterForm.svelte';
	import Transcript from '$lib/transcript/Transcript.svelte';
	import ListenLinks from '$lib/ListenLinks.svelte';
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
	<span
		title="Show #{show.number}"
		style:--transition-name="show-date-{show.number}"
		class="show-number grit">{show.number}</span
	>
	<p class="show-page-date" style:--transition-name="show-date-{show.number}">
		{format(new Date(show.date), 'MMMM do, yyyy')}
		×
		<span class="topics">
			{#each show.aiShowNote?.topics?.slice(0, 5) || [] as topic}
				<span class="topic">#{topic.name}</span>
			{/each}
		</span>
	</p>

	<h1 style:--transition-name="show-title-{show.number}">{show.title}</h1>
	{#if show.aiShowNote?.description}
		<p class="description">{show.aiShowNote?.description}</p>
	{/if}
</header>

<div>
	<HostsAndGuests guests={show.guests} />
</div>

<div class="show-actions">
	<button on:click={() => player.play_show(show)}>
		<Icon name="play{$player.current_show?.number === show.number ? 'ing' : ''}" />
		Play{$player.current_show?.number === show.number ? 'ing' : ''} Episode {show.number}
	</button>
	<span>or</span>
	<ListenLinks {show} />
	<a class="button subtle" download href={show.url}>👇</a>
	<a
		class="subtle button"
		title="Edit Show Notes"
		href={'https://github.com/syntaxfm/website/tree/main/shows' + show.md_file}>✏️</a
	>
	<pre>{JSON.stringify(show.aiShowNote?.tweets)}</pre>
</div>

<div class="tabs">
	<a
		data-sveltekit-noscroll
		class:active={decodeURIComponent($page.url.pathname) ===
			`/shows/${$page.params.show_number}/${$page.params.slug}`}
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
	{#if $page.params.tab === 'transcript' && show?.transcript && show.aiShowNote}
		<Transcript aiShowNote={show.aiShowNote} transcript={show.transcript} />
	{:else}
		<div class="main">
			<div class="show-notes">
				{@html show.show_notes}
			</div>
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
			position: relative;
		}

		h1 {
			view-transition-name: var(--transition-name);
			margin-top: 0;
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
		.topics {
			display: inline-flex;
			gap: 1rem;
		}
		.show-number {
			position: absolute;
			right: 0;
			top: 10%;
			transform: translate(6.9%, -22%);
			--max-font-size: 15rem;
			font-size: clamp(1.5rem, 45cqw, var(--max-font-size));
			font-weight: 900;
			color: var(--yellow);
			line-height: 1;
			transform: rotate(-2deg);
			z-index: 0;
			& ~ * {
				position: relative;
			}
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
