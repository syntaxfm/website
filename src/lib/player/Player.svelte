<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import { player } from '$state/player';
	import format_time from '$utilities/format_time';
	import { fly, slide } from 'svelte/transition';
	import Speed from './Speed.svelte';
	import VolumeBar from './VolumeBar.svelte';

	let audio: HTMLAudioElement | undefined;
	let duration = 0;
	let current_time = 0;

	function play() {
		audio?.play();
		$player.playing = true;
	}
	function pause() {
		audio?.pause();
		$player.playing = false;
	}

	function update_meta() {
		if (audio) {
			duration = audio.duration;
			current_time = audio.currentTime;
		}
	}

	function time_update() {
		if (audio) {
			current_time = audio.currentTime;
		}
	}
</script>

<audio
	bind:this={audio}
	src={$player.current_show?.url}
	on:loadedmetadata={update_meta}
	on:timeupdate={time_update}
/>

{#if $player.status === 'ACTIVE' || $player.status === 'EXPANDED'}
	<section class={`player ${$player.status}`} transition:fly={{ y: '100%' }}>
		<header>
			<button class="player-expand" on:click={player.toggle_expand}><Icon name="expand" /></button>
			<p>Episode #{$player.current_show?.number} - {$player.current_show?.title}</p>
			<button on:click={player.close}>×</button>
		</header>

		{#if $player.status === 'EXPANDED'}
			<div transition:slide>
				<!-- TODO -->
				<h2>
					Hi This is the expanded player. would be a good place for things like a time stamped
					transcript.
				</h2>
			</div>
		{/if}

		<div class="progress-bar">
			<div class="playback-buttons">
				<button id="player-back" on:click={pause}><Icon name="double_left" /></button>
				{#if $player.playing}
					<button id="player-pause" class="player-play" on:click={pause}
						><Icon name="pause" /></button
					>
				{:else}
					<button id="player-play" class="player-play" on:click={play}
						><Icon --icon_size="40px" name="play" /></button
					>
				{/if}
				<button class="player-button pause" on:click={play}><Icon name="double_right" /></button>
			</div>
			{format_time(current_time)}
			<progress max={duration} value={current_time} />
			{format_time(duration)}
			<Speed />
			<VolumeBar />
		</div>
	</section>
{/if}

<style lang="postcss">
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}

	button {
		--button-bg: transparent;
		--button-color: var(--color);
	}

	p {
		margin: 0;
	}

	.playback-buttons {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.EXPANDED .player-expand {
		rotate: 180deg;
	}

	.player {
		padding: 20px;
		position: fixed;
		bottom: 0;
		width: 100vw;
		color: var(--color);
		background-color: var(--player-bg, var(--blackish));
		box-shadow: 0 0 10px 0 oklch(var(--blacklch) / 0.2);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 10px;
	}

	.progress-bar {
		display: flex;
		justify-content: center;
		gap: 20px;
		align-items: center;
	}

	progress {
		border-radius: 0;
		width: 60vw;
	}

	progress[value]::-webkit-progress-value {
		background: linear-gradient(to right, var(--green), var(--teal));
	}
</style>
