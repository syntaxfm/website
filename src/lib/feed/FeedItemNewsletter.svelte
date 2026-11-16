<!-- DON'T USE THIS COMPONENT DIRECTLY -->
<!-- USE FeedItem.svelte instead -->

<script lang="ts">
	import { resolve } from '$app/paths';
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

<article class="stack">
	<h3 class="fv-700-i"><a href={resolve(`snackpack/${issue.id}`)}>{title}</a></h3>
	<FeedByline {label} {published_at} />
</article>

<style>
	article {
		--stack-gap: 14px;

		padding-bottom: 2rem;
	}

	h3 {
		margin: 0;
		font-size: var(--fs-7);
	}
</style>
