<script lang="ts">
	// Pull current specific css var, calculate it's value, pass it as a query param into request.

	interface Props {
		// Wave / Grit / Icon
		name: 'wave';
		fill?: string | null;
		stroke: string | null;
	}

	let { name, fill = 'var(--accent)', stroke }: Props = $props();
	let img: HTMLImageElement = $state(null!);
</script>

<img
	bind:this={img}
	src="/svg/{name}.svg?{fill ? 'f=' + encodeURIComponent(fill) + '&' : ''}{stroke
		? 's=' + encodeURIComponent(stroke)
		: ''}"
	alt="{name} icon"
/>
