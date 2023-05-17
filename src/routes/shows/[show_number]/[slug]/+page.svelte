<script lang="ts">
	import { format } from 'date-fns';
	import type { PageData } from './$types';
	import { player } from '$state/player';

	export let data: PageData;
	$: ({ show } = data);
</script>

<p>{format(new Date(show.date), 'MMMM do, yyyy')}</p>
<h1>{show.title}</h1>
<button on:click={() => player.play_show(show)}>Play Episode {show.number}</button>

<a download href={show.url}>Download Show</a>
<a download href={'https://github.com/syntaxfm/website/tree/main/shows' + show.md_file}
	>Edit Show Notes</a
>

{@html show.show_notes}
