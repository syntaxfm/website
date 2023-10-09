<script lang="ts">
	import { format } from 'date-fns';
	import { player } from '$state/player';
	import { page } from '$app/stores';
	import HostsAndGuests from '../../../../../../lib/HostsAndGuests.svelte';
	import Icon from '$lib/Icon.svelte';
	import NewsletterForm from '$lib/NewsletterForm.svelte';
	import Transcript from '$lib/transcript/Transcript.svelte';
	import ListenLinks from '$lib/ListenLinks.svelte';
	import { json } from 'stream/consumers';
	import Tabs from '$lib/Tabs.svelte';
	import Meta from '$lib/meta/Meta.svelte';
	export let data;
	$: ({ show, meta } = data);

	async function handleClick(e: Event) {
		const { target } = e;
		if (target instanceof HTMLAnchorElement && target.matches(`a[href*='#t=']`)) {
			e.preventDefault();
			const { href } = target;
			player.update_time(href, show);
		}
	}
</script>

<Meta {meta} />

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

	<h1 style:--transition-name="show-title-{show.number}">
		<span class="spa-ran-wrap">{show.title}</span>
	</h1>
	{#if show.aiShowNote?.description}
		<p class="description">{show.aiShowNote?.description}</p>
	{/if}
</header>

<div>
	<HostsAndGuests guests={show.guests} />
</div>

<div class="show-actions-wrap">
	<div class="show-actions zone">
		<div class="show-actions-flex">
			<button on:click={() => player.play_show(show)}>
				<Icon name="play{$player.current_show?.number === show.number ? 'ing' : ''}" />
				Play{$player.current_show?.number === show.number ? 'ing' : ''} Episode {show.number}
			</button>
			<span>or</span>
			<ListenLinks {show} />
		</div>
		<div>
			<a class="icon" title="Download Episode" download href={show.url}>
				<Icon name="download" />
			</a>
			<a
				title="Edit Show Notes"
				class="icon"
				href={'https://github.com/syntaxfm/website/tree/main/shows' + show.md_file}
			>
				<Icon name="edit" /></a
			>
		</div>
		<div class="waves grit"></div>
	</div>
</div>

<Tabs>
	<a
		data-sveltekit-noscroll
		class:active={!$page.params.tab}
		href="/shows/{$page.params.show_number}/{$page.params.slug}">Show Notes</a
	>
	<a
		class:active={$page.params.tab === 'transcript'}
		data-sveltekit-noscroll
		href="/shows/{$page.params.show_number}/{$page.params.slug}/transcript">Transcript</a
	>
</Tabs>

<!-- I don't feel great about this one, but it's hard, because these are click targets on show notes coming in from markdown -->
<!-- I have no idea how we would make those timestamps into click targets correctly, maybe we can dynamically add role="button" -->
<!-- Please submit a PR if you have a good fix here :) - Scott -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<section class="layout full" on:click={handleClick}>
	{#if $page.params.tab === 'transcript'}
		{#if show?.transcript}
			<Transcript aiShowNote={show.aiShowNote} transcript={show.transcript} />
		{:else}
			<p>Transcript not available yet! We have the AI robots on the job, check back soon!</p>
		{/if}
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

		.show-actions-wrap {
			container: show-actions / inline-size;
		}

		.show-actions {
			background: var(--black-9);
			color: var(--white);
			width: 110%;
			left: -5%;
			overflow: hidden;
			@container (min-width: 90vw) {
				width: 100%;
				left: 0;
			}

			position: relative;
			border-radius: 50px;
			grid-column: content / content;
			padding: 2rem;
			margin-bottom: 2rem;
			font-weight: 700;
			display: flex;
			flex-wrap: wrap;
			place-items: center;
			gap: 1rem;
			justify-content: space-between;
			align-items: center;
			align-content: center;
			@media (--below_med) {
				a {
					width: 100%;
				}
			}

			.waves {
				position: absolute;
				z-index: 0;
				background: url('$assets/waves.svg');
				height: 20px;
				width: 100%;
				left: 0;
				bottom: 0;
				background-size: auto 20px;
				background-repeat: repeat-x;
				background-position: left 0;
				animation: ripple 60s linear infinite;
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
			color: var(--primary);
			line-height: 1;
			transform: rotate(-2deg);
			z-index: 0;
			& ~ * {
				position: relative;
			}
		}

		.show-actions-flex {
			display: flex;
			align-items: center;
			gap: 8px;
			span {
				margin-inline: 5px;
			}
		}
	}
</style>
