<script lang="ts">
	import { string_hash } from '#lib/utils/string_hash.ts';
	import {
		dots_to_layers,
		generate_collage,
		squares_to_layers,
		torn_paper_path,
		DEFAULT_PALETTE,
		type CollageDotLayer,
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
	// Thousands of dots and squares, merged into a few paths (see dots_to_layers)
	const layers = $derived(
		data && {
			dots: dots_to_layers(data.dots),
			squares: squares_to_layers(data.squares),
			grit: dots_to_layers(data.grit)
		}
	);
	const solid_clip = $derived(solid ? torn_paper_path(seed, width, height) : '');
	const clip_id = $derived(`collage-${string_hash(seed)}`);
</script>

{#snippet dot_paths(dot_layers: CollageDotLayer[])}
	<g fill="none" stroke-linecap="round">
		{#each dot_layers as layer, index (index)}
			<path d={layer.d} stroke={layer.stroke} stroke-width={layer.width} />
		{/each}
	</g>
{/snippet}

<svg
	class="collage"
	viewBox="0 0 {width} {height}"
	preserveAspectRatio="xMidYMid slice"
	aria-hidden="true"
>
	{#if data && layers}
		<defs>
			<clipPath id={clip_id}>
				<path d={data.clip} />
			</clipPath>
		</defs>
		<g clip-path="url(#{clip_id})">
			<path d={data.clip} fill={palette.paper} />
			{#each data.shapes as shape, index (index)}
				<path d={shape.d} fill={shape.fill} opacity={shape.opacity} />
			{/each}
			{@render dot_paths(layers.dots)}
			{#each layers.squares as layer, index (index)}
				<path d={layer.d} fill={layer.fill} />
			{/each}
			{#each data.strokes as stroke, index (index)}
				<path
					d={stroke.d}
					stroke={stroke.stroke}
					stroke-width={stroke.width}
					opacity={stroke.opacity}
					fill="none"
					stroke-linecap="round"
				/>
			{/each}
			{@render dot_paths(layers.grit)}
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
