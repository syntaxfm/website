<script lang="ts">
	import { player, type Timestamp } from '$state/player';
	export let time_stamps: Timestamp[];

	async function handleClick(e: Event) {
		const { target } = e;
		if (target instanceof HTMLDivElement) {
			const time_stamp = target.getAttribute('data-timestamp');
			player.update_time(time_stamp || '');
		}
	}
</script>

<div class="bookmarks">
	{#each time_stamps as time_stamp}
		<div
			on:click|preventDefault={handleClick}
			data-timestamp={time_stamp.href}
			class="bookmark"
			style:left="{time_stamp.startingPosition}%"
			style:width="{time_stamp.percentage}%"
		/>
		<p>{time_stamp.label}</p>
	{/each}
</div>

<style lang="postcss">
	.bookmarks {
		position: absolute;
		top: 0;
		gap: 2px;
		z-index: 10;
		width: 100%;
		height: 10px;
		opacity: 0;
		display: none;
		@media (--above_med) {
			display: flex;
		}
	}

	.bookmark {
		opacity: 0.5;
		left: 0;
		background-color: var(--white);
		z-index: 9;
		height: 100%;
		transition:
			0.3s ease scale,
			0.3s ease opacity;
		&:hover {
			scale: 1.1;
			opacity: 1;
		}

		&:hover + p {
			display: block;
		}
	}
	p {
		display: none;
		font-size: 12px;
		text-align: center;
		position: absolute;
		top: -20px;
		white-space: nowrap;
		left: 50%;
		translate: -50%;
		margin: 0;
		z-index: 10;
	}

	:global(.player:hover .bookmarks) {
		opacity: 1;
		pointer-events: all;
	}
</style>
