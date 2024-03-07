<script lang="ts">
	import '$/routes/(site)/style.css';
	import { format } from 'date-fns';
	import Icon from '$/lib/Icon.svelte';
	import ListenLinks from '$/lib/ListenLinks.svelte';
	import AlbumArt from '$/lib/player/AlbumArt.svelte';
	import ShareButton from '$/lib/share/HairButton.svelte';
	import { Toaster } from 'svelte-french-toast';
	import ShareActions from '$/lib/share/ShareActions.svelte';
	import { fade } from 'svelte/transition';
	import { episode_share_status } from '$/state/player.js';
	import { browser } from '$app/environment';

	export let data;
	$: ({ show, user_theme } = data);

	function toggle_share() {
		$episode_share_status = !$episode_share_status;
	}
</script>

<div class={'theme-system theme-wrapper zone'}>
	<figure class="zone" style:--bg="var(--black)" style:--fg="var(--white)">
		<span style:--transition-name="show-date-{show.number}" class="show-number grit"
			>{show.number}</span
		>

		<p class="show-page-date" style:--transition-name="show-date-{show.number}">
			{format(new Date(show.date), 'MMMM do, yyyy')}
		</p>
		<h1>
			<span class="spa-ran-wrap">{show.title} </span>
		</h1>

		<div class="player-container">
			<AlbumArt is_link={true} {show} />

			{#if browser}
				<media-controller
					audio
					style="--media-range-track-height: 5px; --media-range-thumb-height: 15px; --media-range-thumb-border-radius: 0;	--media-range-track-border-radius: 5px; --media-range-bar-color: var(--primary);--media-background-color: transparent; --media-control-background: transparent; width: 100%; --media-font-family: var(--body-font-family); --media-control-hover-background: transparent; "
				>
					<audio slot="media" preload="metadata" crossorigin="anonymous" src={show.url} />
					<media-control-bar class="media-bar">
						<div class="media-controls">
							<media-play-button>
								<span slot="play" style="--icon_size: 32px;">
									<Icon name="play" />
								</span>
								<span slot="pause" style="--icon_size: 32px;">
									<Icon name="pause" />
								</span>
							</media-play-button>
						</div>
						<div class="media-range">
							<media-time-display />
							<div class="media-range-bookmarks">
								<media-time-range
									style:--media-range-bar-color="var(--white)"
									style:--media-range-thumb-background="var(--primary)"
								/>
							</div>
							<media-duration-display />
						</div>
						<div class="media-sound">
							<media-playback-rate-button />
						</div>
					</media-control-bar>
				</media-controller>
			{/if}
		</div>

		<div class="embed-actions">
			<ShareButton {show} />
			<ListenLinks {show} />
			<a
				target="_blank"
				class="icon"
				title="Download Episode"
				aria-label="Download"
				download
				href={show.url}
			>
				<Icon name="download" />
			</a>
		</div>
		{#if $episode_share_status}
			<div class="overtake" transition:fade={{ duration: 200 }}>
				<button on:click={toggle_share} class="close">×</button>
				<ShareActions {show} timestamp={false} />
			</div>
		{/if}
	</figure>
</div>

<Toaster />

<style lang="postcss">
	figure {
		--spa-ran-wrap-bg: var(--black);
		border-bottom: solid var(--fg) 1px;
		position: relative;
		z-index: 1;
		margin: 0;
		height: 230px;
		overflow: hidden;
		padding: 20px;
		background-size: contain;
		background-image: var(--bgGritDark),
			radial-gradient(farthest-side circle at 50% 0%, #3a006b66 4% 4%, #000 100%);
	}
	p {
		margin-top: 0;
	}

	.overtake {
		position: absolute;
		background: var(--bg);
		inset: 0;
		z-index: 1;
		padding: 20px;
		display: flex;
		height: 100%;
		align-content: center;
		justify-content: center;
		align-items: center;
		gap: 10px;
	}

	.close {
		top: 10px;
		right: 10px;
		position: absolute;
	}

	h1 {
		font-size: var(--font-size-md);
		height: 64px;
	}

	media-time-range {
		width: 100%;
	}
	.player-container {
		width: 100%;
		display: flex;
		gap: 20px;
	}

	.media-range-bookmarks {
		position: relative;
		width: 100%;
	}

	.show-page-date {
		font-size: var(--font-size-sm);
	}

	.show-number {
		position: absolute;
		right: 0;
		top: 0;
		transform: translate(6.9%, -22%);
		--max-font-size: 15rem;
		--ideal-font-size: 45cqw;
		font-size: clamp(1.5rem, var(--ideal-font-size), var(--max-font-size));
		@media (prefers-color-scheme: dark) {
			--ideal-font-size: 22cqw;
		}
		font-weight: 900;
		color: var(--primary);
		line-height: 1;
		z-index: -1;
	}

	.media-range {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		grid-column: range / range;
		grid-row: 1;
	}

	.media-bar {
		display: grid;
		height: 100%;
		align-items: center;
		gap: 10px;
		grid-template-columns: [start controls] auto [controls range] 1fr [range sound] auto [sound end];
		grid-template-rows: 1fr;
		grid-column: range / range;
	}

	media-controller {
		flex-grow: 1;
	}

	.media-controls {
		display: flex;
		gap: 16px;
		align-items: baseline;
		grid-column: controls / controls;
		grid-row: 1;
	}
	.embed-actions {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
		position: absolute;
		right: 10px;
		bottom: 12px;

		:global(button) {
			padding: 0;
		}
	}

	:global(a[href^='http']:not(.social-icon, .button, .icon, .naked)::after) {
		content: '';
	}

	:global(media-controller button) {
		padding: 0;
	}
</style>
