<script lang="ts" context="module">
	export type IconName =
		| 'play'
		| 'pause'
		| 'stop'
		| 'sort'
		| 'filter'
		| 'expand'
		| 'double_left'
		| 'double_right'
		| 'search'
		| 'twitter';
</script>

<script lang="ts">
	export let name: IconName;
</script>

{#if name === 'play'}
	<svg xmlns="http://www.w3.org/2000/svg" style="width: var(--icon_size, 16px);" viewBox="0 0 16 16"
		><path
			fill="currentColor"
			d="M11.629 7.306a.835.835 0 0 1 0 1.388l-6.401 4.177C4.695 13.218 4 12.825 4 12.176V3.824c0-.649.695-1.042 1.228-.695l6.4 4.177Z"
		/></svg
	>
{/if}

{#if name === 'pause'}
	<svg xmlns="http://www.w3.org/2000/svg" style="width: var(--icon_size, 16px);" viewBox="0 0 16 16"
		><path
			fill="currentColor"
			fill-rule="evenodd"
			d="M5 3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H5Zm5 0a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-1Z"
			clip-rule="evenodd"
		/></svg
	>
{/if}

{#if name === 'sort'}
	<svg xmlns="http://www.w3.org/2000/svg" style="width: var(--icon_size, 16px);" viewBox="0 0 16 16"
		><path
			fill="currentColor"
			fill-rule="evenodd"
			d="m3 14l.53-.53l2.25-2.25a.75.75 0 0 0-1.06-1.061l-.97.97v-8.38a.75.75 0 0 0-1.5 0v8.38l-.97-.97a.75.75 0 1 0-1.06 1.06l2.25 2.25L3 14ZM8.75 4a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3.25a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Zm-.75 4a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Z"
			clip-rule="evenodd"
		/></svg
	>
{/if}

{#if name === 'filter'}
	<svg xmlns="http://www.w3.org/2000/svg" style="width: var(--icon_size, 16px);" viewBox="0 0 16 16"
		><path
			fill="currentColor"
			fill-rule="evenodd"
			d="m8.5 8.379l.44-.44l4.56-4.56V2.5h-11v.879l4.56 4.56l.44.44v4l1-1v-3ZM10 12l-2.5 2.5L6 16V9L1.293 4.293A1 1 0 0 1 1 3.586V2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1.586a1 1 0 0 1-.293.707L10 9v3Z"
			clip-rule="evenodd"
		/></svg
	>
{/if}

{#if name === 'double_left'}
	<svg xmlns="http://www.w3.org/2000/svg" style="width: var(--icon_size, 16px);" viewBox="0 0 16 16"
		><path
			fill="currentColor"
			fill-rule="evenodd"
			d="M7.721 2.22a.75.75 0 0 1 1.061 1.06L4.061 8.002l4.721 4.721a.75.75 0 0 1-1.06 1.061L2.47 8.532a.75.75 0 0 1 0-1.06L7.722 2.22Zm5 0a.75.75 0 0 1 1.061 1.06L9.061 8.002l4.721 4.721a.75.75 0 0 1-1.06 1.061L7.47 8.532a.75.75 0 0 1 0-1.06l5.252-5.252Z"
			clip-rule="evenodd"
		/></svg
	>
{/if}
{#if name === 'double_right'}
	<svg xmlns="http://www.w3.org/2000/svg" style="width: var(--icon_size, 16px);" viewBox="0 0 16 16"
		><path
			fill="currentColor"
			fill-rule="evenodd"
			d="M3.53 2.22a.75.75 0 0 0-1.06 1.06l4.72 4.722l-4.72 4.721a.75.75 0 0 0 1.06 1.061l5.252-5.252a.75.75 0 0 0 0-1.06L3.53 2.22Zm5 0a.75.75 0 0 0-1.06 1.06l4.721 4.722l-4.721 4.721a.75.75 0 0 0 1.06 1.061l5.252-5.252a.75.75 0 0 0 0-1.06L8.53 2.22Z"
			clip-rule="evenodd"
		/></svg
	>
{/if}

{#if name === 'twitter'}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		style="width: var(--icon_size, 16px);"
		fill="none"
		viewBox="0 0 24 24"
		aria-hidden="true"
		class="Icon-module--icon24--b74c8 SocialsNavigation-module--icon--fd20c ariaHidden"
		><g clip-path="url(#twitter-icon)"
			><path
				fill="currentColor"
				d="M21.187 5.348c1.078-.66 1.79-1.565 2.142-2.714-1.05.558-2.09.938-3.135 1.149-.938-1.008-2.124-1.519-3.549-1.519-1.392 0-2.564.488-3.525 1.44-.951.955-1.434 2.118-1.434 3.473 0 .412.051.778.154 1.092-4.1-.14-7.495-1.842-10.17-5.114-.455.801-.68 1.617-.68 2.46 0 1.735.731 3.108 2.194 4.121-.835-.07-1.57-.281-2.194-.628 0 1.237.365 2.273 1.092 3.183a4.828 4.828 0 0 0 2.822 1.72c-.417.108-.853.16-1.303.16-.417 0-.713-.033-.886-.113a4.722 4.722 0 0 0 1.72 2.456c.835.628 1.79.961 2.869.99-1.777 1.391-3.806 2.08-6.103 2.08-.563 0-.961-.009-1.205-.051C2.26 21 4.776 21.73 7.561 21.73c2.85 0 5.372-.722 7.565-2.165 2.194-1.44 3.811-3.211 4.852-5.297 1.045-2.086 1.56-4.257 1.56-6.52v-.624c1.013-.76 1.829-1.617 2.452-2.56a10.7 10.7 0 0 1-2.803.783z"
			/></g
		><defs><clipPath id="twitter-icon"><path fill="#fff" d="M0 0h24v24H0z" /></clipPath></defs></svg
	>
{/if}
{#if name === 'expand'}
	<svg xmlns="http://www.w3.org/2000/svg" style="width: var(--icon_size, 16px);" viewBox="0 0 16 16"
		><path
			fill="currentColor"
			fill-rule="evenodd"
			d="M11.78 5.841a.75.75 0 0 1-1.06 0l-1.97-1.97v7.379a.75.75 0 0 1-1.5 0V3.871l-1.97 1.97a.75.75 0 0 1-1.06-1.06l3.25-3.25L8 1l.53.53l3.25 3.25a.75.75 0 0 1 0 1.061ZM3.75 13.5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Z"
			clip-rule="evenodd"
		/></svg
	>
{/if}
{#if name === 'search'}
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"
		><path
			fill="currentColor"
			fill-rule="evenodd"
			d="M11.5 7a4.5 4.5 0 1 1-9 0a4.5 4.5 0 0 1 9 0Zm-.82 4.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06l-3.04-3.04Z"
			clip-rule="evenodd"
		/></svg
	>
{/if}
