<script lang="ts">
	import MarkdownContent from '#lib/content/MarkdownContent.svelte';

	let { data } = $props();
</script>

<div class="page-content">
	<MarkdownContent content={data.props.content} />
</div>

<style>
	/* Tables in the legal pages (privacy CCPA table, giveaway entry formats). These rules used to ship
	inside privacy.md as a <style> block, which the content renderer drops. Its 16px font sizes equal
	the inherited body size, so `inherit` keeps the same computed size. */
	.page-content :global {
		table,
		th,
		td {
			margin: 0;
			padding: 0 1rem;
			border: 1px solid var(--c-black);
			vertical-align: baseline;
		}

		table,
		td {
			font: inherit;
		}

		table {
			border-collapse: collapse;
			border-spacing: 0;
		}
	}
</style>
