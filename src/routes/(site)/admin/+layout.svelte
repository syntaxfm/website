<script lang="ts">
	import { Toaster } from 'svelte-french-toast';

	let { children } = $props();
</script>

<Toaster />

<div class="admin stack">
	{@render children?.()}
</div>
