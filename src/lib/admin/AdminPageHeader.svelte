<script lang="ts">
	import type { Snippet } from 'svelte';

	// A list page's title, with its page actions (New show, Import all, a create form) on the right

	interface Props {
		title: string;
		// A muted line under the title, such as the YouTube connection
		detail?: string;
		actions?: Snippet;
	}

	let { title, detail, actions }: Props = $props();
</script>

<header class="admin-page-header">
	<h1>{title}</h1>
	{#if detail}
		<p>{detail}</p>
	{/if}
	{#if actions}
		<div class="admin-actions">
			{@render actions()}
		</div>
	{/if}
</header>
