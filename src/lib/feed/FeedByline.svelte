<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { formatDistanceToNowStrict } from 'date-fns';
	import FacePile from '#lib/hosts/FacePile.svelte';

	type Props = {
		// What kind of thing the card is: Syntax Podcast, Syntax Live, Syntax Video
		label: string;
		published_at: string | Date | null;
		faces?: ComponentProps<typeof FacePile>['faces'];
		people?: string;
	};

	const { label, published_at, faces = [], people }: Props = $props();

	const published = $derived(published_at ? new Date(published_at) : null);
</script>

<footer class:has-faces={faces.length > 0}>
	<p class="kind">
		<strong>{label}</strong>
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

	time,
	.people {
		color: var(--c-fg-7);
	}

	/* Not read out: the dot only separates the label from the time for the eye */
	time::before {
		content: '· ' / '';
	}
</style>
