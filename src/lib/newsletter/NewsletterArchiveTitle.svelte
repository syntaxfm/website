<script lang="ts">
	import Dot from '$/icons/Dot.svelte';
	import Icon from '../Icon.svelte';

	interface Props {
		title: string;
		date: string;
		issue: number;
	}

	let { title, date, issue }: Props = $props();
</script>

<article class="newsletter-archive-title flex-column">
	<div class="flex">
		<Icon name="mail-send" height={21} width={21} />
		<p>Issue #{issue}</p>
		<Dot />
		<p>{date}</p>
	</div>
	<h3 class="fv-700-i">{title}</h3>
</article>

<style>
	.newsletter-archive-title {
		border-top: solid 1px var(--c-primary);
		padding-top: 24px;
	}

	.flex {
		align-items: center;
	}

	.dot {
		translate: 0 -3px;
		font-size: 12px;
		display: inline-block;
	}
</style>
