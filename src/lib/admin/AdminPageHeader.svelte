<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';

	// A list page's title, with its page actions (New show, Import all, a create form) on the right

	interface Props {
		title: string;
		// A muted line under the title, such as the YouTube connection
		detail?: string;
		actions?: Snippet;
		// Sibling views of the same thing, such as Episodes and Transcripts under Podcast
		tabs?: { href: string; label: string }[];
	}

	let { title, detail, actions, tabs }: Props = $props();
</script>

<header class="admin-page-header">
	<h1>{title}</h1>
	{#if detail}
		<p>{detail}</p>
	{/if}
	{#if tabs}
		<nav class="admin-section-nav" aria-label={`${title} views`}>
			{#each tabs as tab (tab.href)}
				<a href={tab.href} aria-current={page.url.pathname === tab.href ? 'page' : undefined}
					>{tab.label}</a
				>
			{/each}
		</nav>
	{/if}
	{#if actions}
		<div class="admin-actions">
			{@render actions()}
		</div>
	{/if}
</header>
