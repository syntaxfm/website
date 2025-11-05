<script lang="ts">
	import Dot from '$lib/utilities/Dot.svelte';
	import Icon from '../Icon.svelte';

	interface Props {
		title: string;
		date: string;
		issue: number;
	}

	let { title, date, issue }: Props = $props();
</script>

<a href="/snackpack/{issue}">
	<article class="newsletter-archive-title stack">
		<div class="flex">
			<Icon name="send" height={21} width={21} />
			<p>Issue #{issue}</p>
			<Dot />
			<p>{date}</p>
		</div>
		<h3 class="fv-700-i">{title}</h3>
	</article>
</a>

<style>
	.newsletter-archive-title {
		border-top: solid 2px var(--c-primary);
		padding-top: 24px;
	}

	.flex {
		align-items: center;
	}

	a {
		color: inherit;
	}
</style>
