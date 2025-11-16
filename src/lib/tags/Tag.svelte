<script lang="ts">
	let { children }: { children: Snippet } = $props();
</script>

<a href="/tags/" class="fs-caption">#{@render children()}</a>

<style>
	a {
		display: inline-block;
		border: solid 1px var(--c-fg-6);
		border-radius: var(--br-small);
		padding: 4px 8px;
		display: inline-block;
		text-transform: lowercase;
		text-decoration: none;
		color: var(--fg);
	}
</style>
