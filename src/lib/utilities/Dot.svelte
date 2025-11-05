<script lang="ts">
	interface Props {
		size?: number;
		color?: string;
	}

	let { size = 12, color = 'var(--c-fg)' }: Props = $props();
</script>

<span style:color style:font-size={size + 'px'}>⏺︎</span>

<style>
	span {
		display: inline-block;
	}
</style>
