<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { formatDistanceToNowStrict } from 'date-fns';
	import FacePile from '#lib/hosts/FacePile.svelte';

	type Props = {
		// What kind of thing the card is: Syntax Podcast, Syntax Live, Syntax Video
		label: string;
		// Where the label goes: the list of everything of that kind
		label_href?: string;
		// An episode's show number, after the label as on the /videos cards
		number?: number | null;
		published_at: string | Date | null;
		faces?: ComponentProps<typeof FacePile>['faces'];
		people?: string;
	};

	const { label, label_href, number, published_at, faces = [], people }: Props = $props();

	const published = $derived(published_at ? new Date(published_at) : null);
</script>

<footer class:has-faces={faces.length > 0}>
	<p class="kind">
		<strong>
			{#if label_href}
				<a href={label_href}>{label}</a>
			{:else}
				{label}
			{/if}
			{#if number != null}
				{number}
			{/if}
		</strong>
		{#if published}
			<time datetime={published.toISOString()}>
				{formatDistanceToNowStrict(published, { addSuffix: true })}
			</time>
		{/if}
	</p>
	{#if faces.length > 0}
		<FacePile size="44px" {faces} />
	{/if}
	{#if people}
		<p class="people">{people}</p>
	{/if}
</footer>

<style lang="postcss">
	/* Faces beside two lines of text. On a narrow screen the first line is too long to sit beside
	   them, so it goes above. */
	.has-faces {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-areas:
			'faces kind'
			'faces people';
		align-items: center;
		column-gap: 12px;

		@media (--below-med) {
			grid-template-areas:
				'kind kind'
				'faces people';
			row-gap: 8px;
		}

		> :global(.pile) {
			grid-area: faces;
		}
	}

	p {
		margin: 0;
		font-size: var(--fs-3);
		line-height: 1.4;
	}

	.kind {
		grid-area: kind;
		align-self: end;

		@media (--below-med) {
			align-self: center;
		}
	}

	.people {
		grid-area: people;
		align-self: start;

		@media (--below-med) {
			align-self: center;
		}
	}

	/* Looks like the plain label until it's pointed at */
	.kind a {
		text-decoration: none;

		&:hover,
		&:focus-visible {
			text-decoration: underline;
			text-decoration-color: var(--c-primary);
			text-decoration-thickness: 1.5px;
		}
	}

	time,
	.people {
		color: var(--c-fg-7);
	}

	/* Not read out: the dot only separates the label from the time for the eye */
	time::before {
		content: '· ' / '';
	}
</style>
