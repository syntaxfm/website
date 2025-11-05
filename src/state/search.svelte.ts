import { localStore } from '$utilities/local_store.svelte';

class Search {
	searching = $state(false);
	overlay_open = $state(false);
	search_query = $state('');
	search_recent = localStore<string[]>('svelte:recent-searches', []);
}

export const search = new Search();
