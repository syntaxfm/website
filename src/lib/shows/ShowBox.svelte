<script lang="ts">
	import Icon from '../Icon.svelte';

	const {
		name,
		image,
		button_text,
		intro,
		link
	}: {
		name: string;
		image: string;
		button_text: string;
		intro: string;
		link: string;
	} = $props();
</script>

<article>
	<img src={image} alt={name + ' Logo'} />
	<div>
		<h2>{name}</h2>
		<p>
			{intro}
		</p>
	</div>
	<div class="box-footer">
		<a href={link} class="button button-graphic large"
			>{button_text} <Icon weight={6} width={24} height={24} name="arrow-right" /></a
		>
	</div>
</article>

<style>
	article {
		display: grid;
		gap: 2rem;
		grid-template-columns: 135px 1fr;
		border-radius: var(--br-xlarge);
		padding: var(--pad-large);
		border: var(--b-medium);
		box-shadow: var(--s-graphic-medium);

		.box-footer {
			grid-column: span 2;
			padding-block-end: 2rem;
			text-align: center;
			a {
				rotate: -4deg;
			}
		}
	}
</style>
