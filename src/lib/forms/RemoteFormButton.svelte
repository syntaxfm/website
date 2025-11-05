<script lang="ts">
	import type { RemoteForm, RemoteFormInput } from '@sveltejs/kit';
	import type { Snippet } from 'svelte';

	const { remote, children }: { remote: RemoteForm<any, unknown>; children: Snippet } = $props();
</script>

<form {...remote}>
	<button class="button" type="submit">{@render children()}</button>
</form>
