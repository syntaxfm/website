<script lang="ts">
	import { format } from 'date-fns';

	let { data } = $props();
	let embed: HTMLDivElement | null = $state(null);

	$effect(() => {
		if (embed) {
			embed.innerHTML = '';
			const container = document.createElement("shadow-dom-container");
			const shadow = container.attachShadow({ mode: "open" });
			embed.appendChild(container);
			const wrapper = document.createElement("div");
				wrapper.classList.add('wrapper');
				wrapper.innerHTML = data.html;
				shadow.appendChild(wrapper);
				data.styles?.forEach((style: string) => {
					const style_element = document.createElement('style');
					style_element.innerHTML = style;
					shadow.appendChild(style_element);
				});
				const main_styles = document.createElement('style');
				main_styles.innerHTML = `img {
	max-width: 100%;
}
.ck-inner-section {
	border: 0 !important;
}
table {
	border: 0 !important;
}`
				shadow.appendChild(main_styles);
		}
	});
</script>

<main>
	<header class="center">
		<h2 class="h6">{data.subject}</h2>
		<p class="text-sm">
			You are viewing the Newsletter Archive. Published {format(
				new Date(data.published_at),
				'EEEE MMM dd, yyyy'
			)}
			<br />
			<a href="/snackpack">← Back to all issues</a>
		</p>
	</header>
	<div class="newsletter-output">
		<div bind:this={embed}></div>
	</div>
</main>

<style>
	header {
		padding: var(--default-padding);
	}
	.newsletter-output {
		border: 5px solid black;
		background: white;
	}
</style>
