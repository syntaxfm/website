<script lang="ts">
	import { format } from 'date-fns';
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ show } = data);
</script>

<p>{format(new Date(show.date), 'MMMM do, yyyy')}</p>
<h1>{show.title}</h1>
<audio src={show.url} />
<button>Play Episode {show.number}</button>

<a download href={show.url}>Download Show</a>
<!-- TODO need md file path in db -->
<a download href="TODO">Edit Show Notes</a>

{@html show.show_notes}
