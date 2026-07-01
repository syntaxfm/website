<script lang="ts">
	const width = 26;
	const height = 26;
	const stroke = 6;
	const half_stroke = stroke / 2;
	interface Props {
		top?: boolean;
	}

	let { top = false }: Props = $props();
</script>

<svg
	preserveAspectRatio="none"
	style="

--stroke: {stroke}px"
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 {width} {height}"
	class={top ? 'top' : 'bottom'}
>
	<path
		d="M {half_stroke} 0 C {half_stroke} {width} {height} 0 {width - half_stroke} {height + stroke}"
		fill="none"
		stroke-width={stroke}
	/>
</svg>

<style lang="postcss">
	svg {
		position: absolute;
		top: 100%;

		--x: calc(25% + 3.5px);
		--y: 0;

		translate: var(--x) var(--y);
		stroke: var(--highlight);
		width: 26px;

		&.top {
			top: 0;

			--y: -100%;

			transform: rotateX(180deg);
		}
	}
</style>
