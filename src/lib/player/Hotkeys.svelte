<script lang="ts">
	import { shortcut } from '@svelte-put/shortcut';
	import { player } from '$state/player';

	function showPlayer() {
		if ($player.current_show && $player.status === 'HIDDEN') {
			player.toggle_expand();
		}
	}

	function toggleMinimize() {
		if ($player.current_show && $player.status !== 'MINIMIZED') {
			player.toggle_minimize();
		} else {
			player.toggle_expand();
		}
	}

	function handlePlayPause() {
		if ($player.audio && $player.current_show) {
			showPlayer();
			// play or pause the audio
			if ($player.audio.paused) {
				$player.audio.play();
			} else {
				$player.audio.pause();
			}
		}
	}

	function handleMute() {
		showPlayer();
		if ($player.audio) {
			$player.audio.muted = !$player.audio.muted;
		}
	}

	function seekBackward() {
		if ($player.audio) {
			showPlayer();
			player.update((state) => {
				state.currentTime -= 30;
				return state;
			});
		}
	}

	function seekForward() {
		if ($player.audio) {
			showPlayer();
			player.update((state) => {
				state.currentTime += 30;
				return state;
			});
		}
	}

	function increasePlaybackRate() {
		if ($player.audio) {
			showPlayer();
			player.update((state) => {
				if (state.audio) {
					if (state.audio.playbackRate < 2) {
						state.audio.playbackRate += 0.25;
					}
				}
				return state;
			});
		}
	}

	function decreasePlaybackRate() {
		if ($player.audio) {
			showPlayer();
			player.update((state) => {
				if (state.audio) {
					if (state.audio.playbackRate > 1) {
						state.audio.playbackRate -= 0.25;
					}
				}
				return state;
			});
		}
	}
</script>

<svelte:window
	use:shortcut={{
		trigger: {
			key: 'i',
			callback: toggleMinimize
		}
	}}
	use:shortcut={{
		trigger: {
			key: 'm',
			callback: handleMute
		}
	}}
	use:shortcut={{
		trigger: {
			key: 'j',
			callback: seekBackward
		}
	}}
	use:shortcut={{
		trigger: {
			key: 'l',
			callback: seekForward
		}
	}}
	use:shortcut={{
		trigger: {
			key: '>',
			callback: increasePlaybackRate
		}
	}}
	use:shortcut={{
		trigger: {
			key: '<',
			callback: decreasePlaybackRate
		}
	}}
	use:shortcut={{
		trigger: [
			{
				key: ' ', // the space key
				preventDefault: true,
				callback: handlePlayPause
			},
			{
				key: 'k',
				callback: handlePlayPause
			}
		]
	}}
/>
