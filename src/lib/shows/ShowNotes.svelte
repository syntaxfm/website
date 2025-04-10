<script lang="ts">
	let { show_notes }: { show_notes: string } = $props();
</script>

<div class="show-notes">
	{@html show_notes}
</div>
