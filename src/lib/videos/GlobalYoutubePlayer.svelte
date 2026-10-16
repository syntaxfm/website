<script lang="ts">
	import { youtube_player, type YoutubeVideoElementLike } from '$state/youtube_player';
	import { player } from '$state/player';
	import { player_window_status } from '$state/player_window_status';
	import Icon from '$lib/Icon.svelte';
	import YoutubeVideo from './YoutubeVideo.svelte';
	import { enter_fullscreen, open_show_page } from './video_actions';

	// The one <youtube-video> that plays every episode. It never moves in the DOM (that would reload the iframe),
	// it's positioned over the playing episode's slot on the page, or over the dock in the bottom player bar.

	let element: YoutubeVideoElementLike | null = $state(null);
	let layer_el: HTMLDivElement | null = $state(null);
	let frame_el: HTMLDivElement | null = $state(null);
	let box: { top: number; left: number; width: number; height: number; radius: string } | null =
		$state(null);

	let video_id = $derived($youtube_player.video_id);
	let active_show = $derived($youtube_player.active_show);
	let slot_el = $derived($youtube_player.slot_el);
	let dock_el = $derived($youtube_player.dock_el);
	let placement = $derived($youtube_player.target === 'SLOT' && slot_el ? 'SLOT' : 'DOCK');
	let target_el = $derived(placement === 'SLOT' ? slot_el : dock_el);
	let is_on_show_page = $derived(placement === 'SLOT' && youtube_player.is_show_page_slot(slot_el));
	// A dock marked data-actions="external" shows these buttons itself, there's no room on a small video
	let has_actions = $derived(
		placement === 'DOCK' ? dock_el?.dataset.actions !== 'external' : is_on_show_page
	);
	let is_hidden = $derived(
		$youtube_player.status === 'IDLE' ||
			!target_el ||
			(placement === 'DOCK' && $player_window_status !== 'ACTIVE')
	);
	// Moving between the slot and the dock fades out, repositions, then fades back in
	const FADE_MS = 150;
	let is_fading = $state(false);
	let measured_placement: string | null = null;
	let fade_timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (!element) return;
		return youtube_player.register_element(element);
	});

	function measure() {
		if (!target_el || !layer_el) return;
		const rect = target_el.getBoundingClientRect();
		// Docked is position: fixed (viewport), over a slot is absolute inside the layer, which scrolls with the page
		const origin = placement === 'DOCK' ? { top: 0, left: 0 } : layer_el.getBoundingClientRect();
		box = {
			top: rect.top - origin.top,
			left: rect.left - origin.left,
			width: rect.width,
			height: rect.height,
			radius: getComputedStyle(target_el).borderRadius
		};
	}

	$effect(() => {
		const el = target_el;
		const current_placement = placement;
		const is_docked = current_placement === 'DOCK';
		if (!frame_el) measured_placement = null;
		if (!el || !frame_el) return;

		const has_moved = measured_placement !== null && measured_placement !== current_placement;
		measured_placement = current_placement;
		clearTimeout(fade_timer);
		if (has_moved) {
			is_fading = true;
			fade_timer = setTimeout(() => {
				measure();
				is_fading = false;
			}, FADE_MS);
		} else {
			measure();
		}

		const resize_observer = new ResizeObserver(measure);
		resize_observer.observe(el);
		resize_observer.observe(document.body);
		// The bar slides in with a transform, which ResizeObserver doesn't see
		const bar = is_docked ? el.closest('.player') : null;
		if (bar) resize_observer.observe(bar);
		bar?.addEventListener('transitionend', measure);
		window.addEventListener('resize', measure);

		return () => {
			clearTimeout(fade_timer);
			is_fading = false;
			resize_observer.disconnect();
			bar?.removeEventListener('transitionend', measure);
			window.removeEventListener('resize', measure);
		};
	});

	// YouTube's controls are unusable at dock size, the bar's controls drive it instead.
	// Clicking the docked video plays / pauses it, through the bar so its controls stay in sync.
	let is_playing = $derived($youtube_player.status === 'PLAYING');

	function toggle_playback() {
		if (is_playing) player.pause();
		else player.play();
	}

	function dock() {
		player_window_status.set('ACTIVE');
		youtube_player.dock();
	}

	function handle_play() {
		youtube_player.on_element_play();
	}

	function handle_playing() {
		youtube_player.on_element_play();
		youtube_player.on_element_playing();
	}
</script>

<div class="global-youtube-layer" bind:this={layer_el}>
	{#if video_id}
		<div
			bind:this={frame_el}
			class="global-youtube {placement}"
			class:HIDDEN={is_hidden}
			class:FADING={is_fading}
			inert={is_hidden}
			style:top={box ? `${box.top}px` : null}
			style:left={box ? `${box.left}px` : null}
			style:width={box ? `${box.width}px` : null}
			style:height={box ? `${box.height}px` : null}
			style:border-radius={box?.radius}
			data-testid="global-youtube-player"
		>
			<YoutubeVideo
				{video_id}
				start_seconds={$youtube_player.start_seconds}
				bind:element
				onplay={handle_play}
				onplaying={handle_playing}
				onpause={youtube_player.on_element_pause}
			/>
			{#if placement === 'DOCK' && active_show}
				<button
					type="button"
					class="dock-cover"
					onclick={toggle_playback}
					aria-label={`${is_playing ? 'Pause' : 'Play'} episode ${active_show.number}`}
					title={`#${active_show.number} - ${active_show.title}`}
				></button>
			{/if}
			{#if active_show && has_actions}
				<div class="video-actions">
					{#if placement === 'DOCK'}
						<button
							type="button"
							onclick={open_show_page}
							aria-label={`Watch episode ${active_show.number} on its page`}
							title="Watch on episode page"><Icon name="undock" /></button
						>
					{:else}
						<button
							type="button"
							onclick={dock}
							aria-label="Move video to the player bar"
							title="Dock in player bar"><Icon name="minimize" /></button
						>
					{/if}
					<button
						type="button"
						onclick={enter_fullscreen}
						aria-label="Full screen video"
						title="Full screen"><Icon name="fullscreen" /></button
					>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="postcss">
	.global-youtube-layer {
		position: absolute;
		top: 0;
		left: 0;
		width: 0;
		height: 0;
	}

	.global-youtube {
		overflow: hidden;
		background: var(--black);
		/* Default size for warming up before the first play, hidden */
		width: 356px;
		height: 200px;

		&.SLOT {
			position: absolute;
			/* Under the bottom player bar */
			z-index: 5;
		}

		&.DOCK {
			position: fixed;
			/* Over the bottom player bar */
			z-index: 11;
		}

		/* visibility flips at the end of a fade out and the start of a fade in */
		transition:
			opacity 150ms ease,
			visibility 150ms;

		&.FADING {
			opacity: 0;
			pointer-events: none;
		}

		&.HIDDEN {
			/* Not display: none, the iframe needs to stay rendered to keep playing */
			opacity: 0;
			visibility: hidden;
			pointer-events: none;
		}
	}

	.dock-cover {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		background: transparent;
		cursor: pointer;
	}

	.video-actions {
		position: absolute;
		top: 6px;
		right: 6px;
		display: flex;
		gap: 6px;

		button {
			display: grid;
			place-items: center;
			padding: 7.5px;
			border: 0;
			border-radius: var(--brad);
			background: oklch(var(--blacklch) / 0.7);
			color: var(--white);
			--icon_size: 18px;
		}
	}
</style>
