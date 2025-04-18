<script lang="ts">
	let { title }: { title: string } = $props();
</script>

<h3 class="fs-caption fv-400">{title}</h3>

<style lang="postcss">
	.fs-caption {
		border: solid 1px var(--c-fg);
		border-radius: var(--br-small);
		padding: 6px 10px;
		margin-bottom: 2rem;
	}
</style>
