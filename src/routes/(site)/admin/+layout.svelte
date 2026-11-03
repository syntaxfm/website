<script lang="ts">
	let { children } = $props();
</script>

<div class="admin stack">
	{@render children?.()}
</div>
