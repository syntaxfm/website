<script lang="ts">
	import type { Snippet } from 'svelte';

	// The thick black frame around a page's main video (episode and video pages)
	let { children }: { children: Snippet } = $props();
</script>

<div class="video-bezel">
	{@render children()}
</div>

<style>
	.video-bezel {
		width: 100%;
		color: var(--c-fg);

		/* Mirrors `--s-graphic-heavy` but pinned to `--c-black` so the drop shadow
		   stays black in dark mode (matching the black bezel) instead of following
		   `--c-fg` to white. Inlined because the token bakes `--c-fg` at `:root`. */
		box-shadow:
			-5px 5px 0 var(--c-black),
			-10px 10px 0 var(--c-black),
			-11px 11px 0 var(--c-black),
			-12px 12px 0 var(--c-black),
			-13px 13px 0 var(--c-black),
			-14px 14px 0 var(--c-black),
			-15px 15px 0 var(--c-black),
			-20px 20px 0 var(--c-black);
		border: var(--c-black) solid 10px;
		overflow: hidden;
		border-radius: 24px;

		/* The outer radius minus the 10px bezel */
		--embed-radius: 14px;

		margin-bottom: 2rem;
	}
</style>
