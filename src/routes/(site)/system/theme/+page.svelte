<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import ShowCard from '$lib/ShowCard.svelte';
	import { theme_maker } from '$state/theme';
	import { onMount } from 'svelte';

	export let data;
	const { show } = data;

	onMount(() => {
		theme_maker.open();
	});
	afterNavigate(() => {
		theme_maker.open();
	});
</script>

<div class="zone">
	<h3>Normal Zone</h3>
	<p>
		By default zones don't have any padding, but they do enable easy setting of local --bg and --fg
		variables.
	</p>
</div>
<div class="zone" style:--bg="var(--fg-sheet)" style:--fg="var(--bg-sheet)">
	<h3>Inverse Zone</h3>
	<p>
		By default zones don't have any padding, but they do enable easy setting of local --bg and --fg
		variables.
	</p>
</div>
<div class="zone" style:--bg="var(--bg-root)" style:--fg="var(--fg-root)">
	<h3>Always Dark Zone</h3>
	<p>
		By default zones don't have any padding, but they do enable easy setting of local --bg and --fg
		variables.
	</p>
</div>

<div
	class="zone"
	style="border: solid 0.5px var(--black-1)"
	style:--radius="20px"
	style:--bg="var(--bg-1)"
>
	<h3>Zone With Accent</h3>
	<p>
		A zone with accents is just a zone with custom style, --bg, --radius, --border values. This
		utilizes the --bg-1 variable to control accents in themes.
	</p>
</div>

{#if show?.id}
	<h3>Grid With Cards</h3>
	<div class="grid">
		<ShowCard display="highlight" {show} />
		<ShowCard {show} /><ShowCard {show} /><ShowCard {show} />
	</div>
{/if}
