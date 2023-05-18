<script lang="ts">
	import { player } from '$state/player';
	import format_time from '$utilities/format_time';

	let audio: HTMLAudioElement;

	let duration = 0;
	let current_time = 0;

	function play() {
		audio.play();
	}
	function pause() {
		audio.pause();
	}

	function update_meta() {
		duration = audio?.duration;
		current_time = audio?.currentTime;
	}

	function time_update() {
		current_time = audio?.currentTime;
	}
</script>

{#if $player.status === 'ACTIVE'}
	<section class="player">
		<p>{$player.current_show?.title}</p>
		{format_time(current_time)} / {format_time(duration)}
		<progress max={duration} value={current_time} />
		<button on:click={play}>Play</button>
		<button on:click={pause}>Pause</button>

		<audio
			bind:this={audio}
			src={$player.current_show?.url}
			on:loadedmetadata={update_meta}
			on:timeupdate={time_update}
		/>
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
		height: 100px;
		background-color: var(--player_bg, var(--blackish));
	}
</style>
