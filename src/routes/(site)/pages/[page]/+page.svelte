<script lang="ts">
	import MarkdownContent from '#lib/content/MarkdownContent.svelte';

	let { data } = $props();
</script>

<div class="prose">
	<MarkdownContent content={data.props.content} />
</div>
