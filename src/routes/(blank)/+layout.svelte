<script lang="ts">
	import '../(site)/style.css';
	import 'media-chrome';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

{@render children?.()}
