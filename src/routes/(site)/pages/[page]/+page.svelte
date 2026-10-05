<script lang="ts">
	import MarkdownContent from '$lib/content/MarkdownContent.svelte';

	let { data } = $props();
</script>

<div class="page-content">
	<MarkdownContent content={data.props.content} />
</div>

<style>
	/* The privacy policy's CCPA table. These rules used to ship inside privacy.md as a <style> block,
	which the content renderer drops. Its 16px font sizes equal the inherited body size, so `inherit`
	keeps the same computed size. */
	.page-content :global {
		table,
		td {
			margin: 0;
			padding: 0 1rem;
			border: 1px solid var(--c-black);
			font: inherit;
			vertical-align: baseline;
		}

		table {
			border-collapse: collapse;
			border-spacing: 0;
		}
	}
</style>
