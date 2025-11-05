<script lang="ts">
	import PrevNext from '$lib/shows/PrevNext.svelte';
	import ShowNotes from '$lib/shows/ShowNotes.svelte';
	let { data } = $props();
	let { show, prev_show, next_show } = $derived(data);
</script>

<div class="main">
	<ShowNotes show_notes={show.show_notes} />
	<PrevNext {prev_show} {next_show} />
</div>
