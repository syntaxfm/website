<script lang="ts">
	const width = 26;
	const height = 26;
	const stroke = 6;
	const halfStroke = stroke / 2;
	export let top: boolean = false;
</script>

<svg
	preserveAspectRatio="no"
	style="--stroke: {stroke}px"
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 {width} {height}"
	class={top ? 'top' : 'bottom'}
>
	<path
		d="M {halfStroke} 0 C {halfStroke} {width} {height} 0 {width - halfStroke} {height + stroke}"
		fill="none"
		stroke-width={stroke}
	/>
</svg>

<style>
	svg {
		position: absolute;
		top: 100%;
		--x: calc(25% + 3.5px);
		--y: 0;
		translate: var(--x) var(--y);
		stroke: var(--purple);
		width: 26px;
		&.top {
			top: 0;
			--y: -100%;
			transform: rotateX(180deg);
		}
	}
</style>
