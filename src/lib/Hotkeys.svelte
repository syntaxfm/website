<script lang="ts">
	import { shortcut, type ShortcutTrigger } from '@svelte-put/shortcut';
	import { player } from '$state/player';

	// This is where hotkeys are defined
	interface Hotkeys {
		[key: string]: {
			description: string;
			trigger: ShortcutTrigger;
		};
	}

	const hotkeys = {
		showHideHotkeys: {
			description: 'Show or hide the hotkeys',
			trigger: {
				key: '?',
				callback: () => {
					console.log(`Hotkeys being shown or hidden`);
				}
			}
		},
		minimize: {
			description: 'Minimize or expand the player',
			trigger: {
				key: 'i',
				callback: toggleMinimize
			}
		},
		playPause: {
			description: 'Play or pause the audio',
			trigger: {
				key: ' ', // the space key
				preventDefault: true,
				callback: handlePlayPause
			}
		},
		mute: {
			description: 'Mute or unmute the audio',
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

	function getHotkeyTrigger(hotkey: keyof typeof hotkeys) {
		return hotkeys[hotkey].trigger;
	}

	// Callback functions called when hotkeys are triggered
	function showPlayer() {
		if ($player.current_show) {
			if ($player.status == 'HIDDEN') {
				player.toggle_expand();
			}
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
	use:shortcut={{ trigger: getHotkeyTrigger('showHideHotkeys') }}
	use:shortcut={{ trigger: getHotkeyTrigger('minimize') }}
	use:shortcut={{ trigger: getHotkeyTrigger('mute') }}
	use:shortcut={{ trigger: getHotkeyTrigger('seekBackward') }}
	use:shortcut={{ trigger: getHotkeyTrigger('seekForward') }}
	use:shortcut={{ trigger: getHotkeyTrigger('increasePlaybackRate') }}
	use:shortcut={{ trigger: getHotkeyTrigger('decreasePlaybackRate') }}
	use:shortcut={{ trigger: getHotkeyTrigger('playPause') }}
/>
