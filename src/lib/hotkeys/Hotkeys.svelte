<script lang="ts">
	import type { Hotkeys } from '$lib/hotkeys/types';
	import { getHotkeyTrigger } from '$lib/hotkeys/utils';
	import { player } from '$state/player';
	import { shortcut } from '@svelte-put/shortcut';
	import HotkeyDialog from './HotkeyDialog.svelte';

	// This is where hotkeys are defined
	let hotkeys = {
		playPause: {
			description: 'Play / pause the audio',
			trigger: {
				key: ' ', // the space key
				preventDefault: true,
				callback: handlePlayPause
			}
		},
		minimize: {
			description: 'Minimize / expand the player',
			trigger: {
				key: 'i',
				callback: toggleMinimize
			}
		},
		mute: {
			description: 'Mute / unmute the audio',
			trigger: {
				key: 'm',
				callback: handleMute
			}
		},
		seekBackward: {
			description: 'Seek backward 30 seconds',
			trigger: {
				key: 'j',
				callback: seekBackward
			}
		},
		seekForward: {
			description: 'Seek forward 30 seconds',
			trigger: {
				key: 'l',
				callback: seekForward
			}
		},
		increasePlaybackRate: {
			description: 'Increase playback rate',
			trigger: {
				key: '>',
				callback: increasePlaybackRate
			}
		},
		decreasePlaybackRate: {
			description: 'Decrease playback rate',
			trigger: {
				key: '<',
				callback: decreasePlaybackRate
			}
		}
	} satisfies Hotkeys;

	// These functions are called when hotkeys are triggered

	function toggleMinimize() {
		player.toggle_minimize();
	}

	function handlePlayPause() {
		if ($player.audio && $player.current_show) {
			// play or pause the audio
			if ($player.audio.paused) {
				player.play();
			} else {
				player.pause();
			}
		}
	}

	function handleMute() {
		if ($player.audio) {
			$player.audio.muted = !$player.audio.muted;
		}
	}

	function seekBackward() {
		if ($player.audio) {
			player.update((state) => {
				state.currentTime -= 30;
				return state;
			});
		}
	}

	function seekForward() {
		if ($player.audio) {
			player.update((state) => {
				state.currentTime += 30;
				return state;
			});
		}
	}

	function increasePlaybackRate() {
		if ($player.audio) {
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
	use:shortcut={{ trigger: getHotkeyTrigger('showHideHotkeys', hotkeys) }}
	use:shortcut={{ trigger: getHotkeyTrigger('minimize', hotkeys) }}
	use:shortcut={{ trigger: getHotkeyTrigger('mute', hotkeys) }}
	use:shortcut={{ trigger: getHotkeyTrigger('seekBackward', hotkeys) }}
	use:shortcut={{ trigger: getHotkeyTrigger('seekForward', hotkeys) }}
	use:shortcut={{ trigger: getHotkeyTrigger('increasePlaybackRate', hotkeys) }}
	use:shortcut={{ trigger: getHotkeyTrigger('decreasePlaybackRate', hotkeys) }}
	use:shortcut={{ trigger: getHotkeyTrigger('playPause', hotkeys) }}
/>

<HotkeyDialog {hotkeys} />
