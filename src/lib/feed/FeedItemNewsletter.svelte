<!-- DON'T USE THIS COMPONENT DIRECTLY -->
<!-- USE FeedItem.svelte instead -->

<script lang="ts">
	import { resolve } from '$app/paths';
	import snack_box from '#lib/newsletter/snack-box.png';
	import FeedByline from './FeedByline.svelte';

	type Props = {
		title: string;
		issue: { id: string; issue_number: number | null };
		published_at: string | Date | null;
	};

	const { title, issue, published_at }: Props = $props();

	const label = $derived(
		issue.issue_number == null ? 'Snack Pack' : `Snack Pack #${issue.issue_number}`
	);
</script>

<article>
	<div class="card">
		<p class="sticker">
			<img src={snack_box} alt="" width="500" height="500" loading="lazy" />
			<span class="tag">Newsletter</span>
		</p>
		<h3 class="fv-700-i"><a href={resolve(`snackpack/${issue.id}`)}>{title}</a></h3>
		<FeedByline {label} {published_at} />
	</div>
</article>

<style lang="postcss">
	article {
		/* With the feed's own gap, cards sit further from each other than a card's parts do */
		padding-bottom: 2rem;
	}

	/* The Snack Pack's yellow band, small: it reads as a newsletter issue among the video cards.
	   Black ink on yellow in either theme. */
	.card {
		--c-fg: var(--c-black);
		--c-fg-7: oklch(from var(--c-black) l c h / 0.7);

		/* The drawing fills about 60% of its square file */
		--box-size: clamp(8.5rem, 15vw, 11rem);

		position: relative;
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 2rem;
		padding-inline-end: calc(var(--box-size) + 4rem);
		border-radius: var(--br-medium);
		background-color: var(--c-primary);
		background-image: var(--c-bg-grit-light);
		color: var(--c-black);

		/* The sticker moves up onto the top corner, so the text takes the whole width under it */
		@media (--below-med) {
			--box-size: 5.5rem;

			padding: 3.25rem 1.25rem 1.5rem;
		}
	}

	h3 {
		margin: 0;
		font-size: var(--fs-7);
		text-wrap: balance;
	}

	/* The whole card opens the issue */
	a {
		color: inherit;
		text-decoration: none;

		&::after {
			content: '';
			position: absolute;
			inset: 0;
			border-radius: inherit;
		}
	}

	/* The ring goes round the card, not the title: yellow on the page, outside the card */
	a:focus-visible {
		outline: none;
	}

	.card:has(a:focus-visible) {
		outline: 2px solid var(--c-primary);
		outline-offset: 4px;
	}

	/* The snack box with a "Newsletter" tag stuck across its bottom, on the card's right edge.
	   On a phone it sits on the top corner, the tag beside the box. */
	.sticker {
		position: absolute;
		inset-block-start: 50%;
		inset-inline-end: 2rem;
		display: grid;
		justify-items: center;
		margin: 0;
		translate: 0 -50%;

		@media (--below-med) {
			inset-block-start: -1.75rem;
			inset-inline-end: 0.5rem;
			grid-auto-flow: column;
			align-items: center;
			translate: none;
		}
	}

	img {
		width: var(--box-size);
		height: auto;
		rotate: 8deg;
		transition: rotate 0.2s ease;
	}

	.tag {
		align-self: start;
		margin-block-start: -3rem;
		padding: 4px 10px;
		border-radius: var(--br-small);
		background: var(--c-black);
		color: var(--c-primary);
		font-size: var(--fs-2);
		rotate: -6deg;

		@media (--below-med) {
			order: -1;
			align-self: center;
			margin: 0 -0.75rem 0 0;
		}
	}

	.card:hover img {
		rotate: -4deg;
	}

	@media (prefers-reduced-motion: reduce) {
		img {
			transition: none;
		}
	}
</style>
