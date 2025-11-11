<script lang="ts">
	let { children } = $props();
</script>

<div class="admin stack">
	{@render children?.()}
</div>

<style>
	.admin {
		padding: var(--pad-medium) 0 4rem;
	}
</style>
