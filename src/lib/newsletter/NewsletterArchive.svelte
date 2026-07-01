<script lang="ts">
	import { format } from 'date-fns';
	import Dot from '$lib/utilities/Dot.svelte';
	import Icon from '../Icon.svelte';
	import { resolve } from '$app/paths';

	interface Props {
		id: number;
		issue_number: number | null;
		title: string;
		date: string;
	}

	let { id, issue_number, title, date }: Props = $props();

	const formatted_date = $derived(format(new Date(date), 'MMM dd, yyyy'));
</script>

<a class="newsletter-archive stack" href={resolve(`/snackpack/${id}`)}>
	<p class="meta flex">
		<Icon name="send" height={20} width={20} />
		{#if issue_number != null}
			<span class="fv-500-i">Issue #{issue_number}</span>
			<Dot size={8} />
		{/if}
		<span>{formatted_date}</span>
	</p>
	<h3 class="title fv-700-i">{title}</h3>
</a>

<style lang="postcss">
	.newsletter-archive {
		--stack-gap: var(--pad-small);

		container: newsletter-archive / inline-size;
		border-top: solid 2px var(--c-primary);
		padding-top: var(--pad-large);
		color: inherit;
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.meta {
		--flex-gap: var(--pad-small);

		align-items: center;
		font-size: clamp(var(--fs-2), 2cqi, var(--fs-4));
	}

	.title {
		font-size: clamp(var(--fs-5), 4.1cqi, var(--fs-8));
		line-height: 1.2;
		text-wrap: balance;
	}

	.newsletter-archive:hover .title {
		color: var(--c-primary);
	}
</style>
