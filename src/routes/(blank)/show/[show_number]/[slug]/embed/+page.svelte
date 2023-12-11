<script lang="ts">
	import '$/routes/(site)/style.css';
	import 'media-chrome';
	import { format } from 'date-fns';
	import { theme } from '$state/theme';
	import Icon from '$/lib/Icon.svelte';
	import ListenLinks from '$/lib/ListenLinks.svelte';

	export let data;
	$: ({ show, user_theme } = data);
	$theme = user_theme;
</script>

<div class={'theme-system theme-wrapper zone'}>
	<figure class="zone" style:--bg="var(--black)" style:--fg="var(--white)">
		<span style:--transition-name="show-date-{show.number}" class="show-number grit"
			>{show.number}</span
		>

		<p class="show-page-date" style:--transition-name="show-date-{show.number}">
			{format(new Date(show.date), 'MMMM do, yyyy')}
			×
			<span class="topics">
				{#each show.aiShowNote?.topics?.slice(0, 5) || [] as topic}
					<span class="topic">{topic.name.startsWith('#') ? '' : '#'}{topic.name}</span>
				{/each}
			</span>
		</p>
		<h1>{show.title}</h1>

		<button>Share</button>
		<ListenLinks {show} />
		<a class="icon" title="Download Episode" aria-label="Download" download href={show.url}>
			<Icon name="download" />
		</a>
		<button>Subscribe</button>
	</figure>
</div>

<style lang="postcss">
	figure {
		border-bottom: solid var(--fg) 1px;
		position: relative;
		z-index: 1;
		margin: 0;
		padding: 20px;
	}

	h1 {
		font-size: var(--font-size-lg);
	}

	.show-number {
		position: absolute;
		right: 0;
		top: 0;
		transform: translate(6.9%, -22%);
		--max-font-size: 15rem;
		--ideal-font-size: 45cqw;
		font-size: clamp(1.5rem, var(--ideal-font-size), var(--max-font-size));
		@media (prefers-color-scheme: dark) {
			--ideal-font-size: 22cqw;
		}
		font-weight: 900;
		color: var(--primary);
		line-height: 1;
		z-index: -1;
	}
</style>
