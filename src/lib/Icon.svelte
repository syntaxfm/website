<script lang="ts">
	export let name: 'play' | 'pause' | 'stop';
</script>

{#if name === 'play'}
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"
		><path
			fill="currentColor"
			d="M11.629 7.306a.835.835 0 0 1 0 1.388l-6.401 4.177C4.695 13.218 4 12.825 4 12.176V3.824c0-.649.695-1.042 1.228-.695l6.4 4.177Z"
		/></svg
	>
{/if}

{#if name === 'pause'}
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"
		><path
			fill="currentColor"
			fill-rule="evenodd"
			d="M5 3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H5Zm5 0a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-1Z"
			clip-rule="evenodd"
		/></svg
	>
{/if}
