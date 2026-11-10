<script lang="ts">
	import '../(site)/style.css';
	import 'media-chrome';
	import SiteFont from '#lib/layout/SiteFont.svelte';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<SiteFont />
{@render children?.()}
