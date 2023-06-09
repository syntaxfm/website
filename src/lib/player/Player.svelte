<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import { player } from '$state/player';
	import format_time from '$utilities/format_time';
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

{#if $player.status === 'ACTIVE'}
	<section class="player">
		<p>Episode #{$player.current_show?.number} - {$player.current_show?.title}</p>

		<div>
			<button class="player-button" on:click={pause}><Icon name="double_left" /></button>
			{#if $player.playing}
				<button class="player-button" on:click={pause}><Icon name="pause" /></button>
			{:else}
				<button class="player-button pause" on:click={play}><Icon name="play" /></button>
			{/if}
			<button class="player-button pause" on:click={play}><Icon name="double_right" /></button>
		</div>

		<div class="progress-bar">
			{format_time(current_time)}
			<progress max={duration} value={current_time} />
			{format_time(duration)}
			<Speed />
			<VolumeBar />
		</div>
	</section>
{/if}

<style>
	p {
		margin: 0;
	}

	.player {
		padding: 20px;
		position: fixed;
		bottom: 0;
		width: 100vw;
		height: 150px;
		color: var(--color);
		background-color: var(--player-bg, var(--blackish));
		border-top: 3px var(--primary) solid;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 10px;
	}

	.player-button {
		background: linear-gradient(to right, var(--green), var(--teal));
		border-radius: 50%;
		padding: 10px;
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
