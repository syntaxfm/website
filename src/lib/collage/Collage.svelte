<script lang="ts">
	import { string_hash } from '$lib/utils/string_hash';
	import {
		generate_collage,
		torn_paper_path,
		DEFAULT_PALETTE,
		type CollagePalette
	} from './collage';

	interface Props {
		/** Seed string — same value always produces the same collage. */
		seed: string;
		/** Internal viewBox size; the SVG scales to fill its container (slice). */
		width?: number;
		height?: number;
		palette?: CollagePalette;
		/** When set, render only the torn outline filled with this colour (a plain
		    backing "paper" rather than the full textured collage). */
		solid?: string;
	}

	let { seed, width = 1000, height = 300, palette = DEFAULT_PALETTE, solid }: Props = $props();

	const data = $derived(solid ? null : generate_collage(seed, width, height, palette));
	const solid_clip = $derived(solid ? torn_paper_path(seed, width, height) : '');
	const clip_id = $derived(`collage-${string_hash(seed)}`);
</script>

<svg
	class="collage"
	viewBox="0 0 {width} {height}"
	preserveAspectRatio="xMidYMid slice"
	aria-hidden="true"
>
	{#if data}
		<defs>
			<clipPath id={clip_id}>
				<path d={data.clip} />
			</clipPath>
		</defs>
		<g clip-path="url(#{clip_id})">
			<path d={data.clip} fill={palette.paper} />
			{#each data.shapes as shape}
				<path d={shape.d} fill={shape.fill} opacity={shape.opacity} />
			{/each}
			{#each data.dots as dot}
				<circle cx={dot.cx} cy={dot.cy} r={dot.r} fill={dot.fill} />
			{/each}
			{#each data.squares as sq}
				<rect x={sq.x} y={sq.y} width={sq.size} height={sq.size} fill={sq.fill} />
			{/each}
			{#each data.strokes as stroke}
				<path
					d={stroke.d}
					stroke={stroke.stroke}
					stroke-width={stroke.width}
					opacity={stroke.opacity}
					fill="none"
					stroke-linecap="round"
				/>
			{/each}
			{#each data.grit as speck}
				<circle cx={speck.cx} cy={speck.cy} r={speck.r} fill={speck.fill} />
			{/each}
		</g>
	{:else}
		<path d={solid_clip} fill={solid} />
	{/if}
</svg>

<style>
	.collage {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
