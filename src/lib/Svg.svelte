<script lang="ts">
	import { onMount } from 'svelte';
	// Pull current specific css var, calculate it's value, pass it as a query param into request.
	// Wave / Grit / Icon
	export let name: 'wave';
	export let fill: string | null = 'var(--accent)';
	export let stroke: string | null;
	let img: HTMLImageElement;
</script>

<img
	bind:this={img}
	src="/svg/{name}.svg?{fill ? 'f=' + encodeURIComponent(fill) + '&' : ''}{stroke
		? 's=' + encodeURIComponent(stroke)
		: ''}"
	alt="{name} icon"
/>
