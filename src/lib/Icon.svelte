<script lang="ts" context="module">
	export type IconName = 'play' | 'pause' | 'stop' | 'sort' | 'filter';
</script>

<script lang="ts">
	export let name: 'play' | 'pause' | 'stop' | 'sort' | 'filter' | 'double_left' | 'double_right';
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

{#if name === 'sort'}
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"
		><path
			fill="currentColor"
			fill-rule="evenodd"
			d="m3 14l.53-.53l2.25-2.25a.75.75 0 0 0-1.06-1.061l-.97.97v-8.38a.75.75 0 0 0-1.5 0v8.38l-.97-.97a.75.75 0 1 0-1.06 1.06l2.25 2.25L3 14ZM8.75 4a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3.25a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Zm-.75 4a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Z"
			clip-rule="evenodd"
		/></svg
	>
{/if}

{#if name === 'filter'}
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"
		><path
			fill="currentColor"
			fill-rule="evenodd"
			d="m8.5 8.379l.44-.44l4.56-4.56V2.5h-11v.879l4.56 4.56l.44.44v4l1-1v-3ZM10 12l-2.5 2.5L6 16V9L1.293 4.293A1 1 0 0 1 1 3.586V2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1.586a1 1 0 0 1-.293.707L10 9v3Z"
			clip-rule="evenodd"
		/></svg
	>
{/if}

{#if name === 'double_left'}
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"
		><path
			fill="currentColor"
			fill-rule="evenodd"
			d="M7.721 2.22a.75.75 0 0 1 1.061 1.06L4.061 8.002l4.721 4.721a.75.75 0 0 1-1.06 1.061L2.47 8.532a.75.75 0 0 1 0-1.06L7.722 2.22Zm5 0a.75.75 0 0 1 1.061 1.06L9.061 8.002l4.721 4.721a.75.75 0 0 1-1.06 1.061L7.47 8.532a.75.75 0 0 1 0-1.06l5.252-5.252Z"
			clip-rule="evenodd"
		/></svg
	>
{/if}
{#if name === 'double_right'}
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"
		><path
			fill="currentColor"
			fill-rule="evenodd"
			d="M3.53 2.22a.75.75 0 0 0-1.06 1.06l4.72 4.722l-4.72 4.721a.75.75 0 0 0 1.06 1.061l5.252-5.252a.75.75 0 0 0 0-1.06L3.53 2.22Zm5 0a.75.75 0 0 0-1.06 1.06l4.721 4.722l-4.721 4.721a.75.75 0 0 0 1.06 1.061l5.252-5.252a.75.75 0 0 0 0-1.06L8.53 2.22Z"
			clip-rule="evenodd"
		/></svg
	>
{/if}
