<script lang="ts">
	import { debug_mode } from '$state/debug';
</script>

{#if $debug_mode}
	<div class="l-margin-debug">
		<div class="layout-debug-bg"></div>
	</div>
	<div class="content-debug">
		<div class="layout-debug-bg"></div>
	</div>
	<div class="r-margin-debug">
		<div class="layout-debug-bg"></div>
	</div>
{/if}

<style>
	:global(.layout) > .l-margin-debug {
		pointer-events: none;
		grid-column: l-margin / l-margin-end !important;
		grid-row: 1 / -1;
		position: relative;
	}
	:global(.layout) .r-margin-debug {
		pointer-events: none;
		grid-column: r-margin / r-margin-end !important;
		grid-row: 1 / -1;
		position: relative;
	}

	:global(.layout) .content-debug {
		pointer-events: none;
		grid-column: content / content;
		grid-row: 1 / -1;
		position: relative;
	}

	.layout-debug-bg {
		background-color: red;
		opacity: 0.1;
		position: absolute;
		top: 0;
		height: 100vh;
		width: 100%;
	}
</style>
