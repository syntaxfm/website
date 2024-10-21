<script lang="ts">
	let modal: HTMLDialogElement = $state(null!);
	import { clickOutDialog } from '$actions/click_outside_dialog';
	import type { Hotkeys } from './types';
	import { formatShortcut } from './utils';

	interface Props {
		hotkeys: Hotkeys;
	}

	let { hotkeys = $bindable() }: Props = $props();

	async function close() {
		modal.close();
	}

	async function toggleModalOpen() {
		if (modal.open) {
			close();
		} else {
			modal.showModal();
		}
	}

	hotkeys['showHideHotkeys'] = {
		description: 'Show / hide this window',
		trigger: {
			key: '?',
			callback: toggleModalOpen
		} //
	};

	const hotkeyNames = Object.keys(hotkeys);
</script>

<dialog
	bind:this={modal}
	class="zone"
	style:--bg="var(--bg-sheet)"
	style:--fg="var(--fg-sheet)"
	use:clickOutDialog
	onclick-outside={close}
	aria-labelledby="hotkey-header"
>
	<section aria-label="Hotkey Help Window">
		<header role="banner">
			<h3 class="h5" id="hotkey-header">Hotkeys</h3>
			<button class="close" onclick={close} type="submit">×</button>
		</header>
		<div class="hotkeys">
			{#each hotkeyNames as hotkey}
				<div class="hotkey-container">
					<button class="hotkey-key">{formatShortcut(hotkeys[hotkey].trigger)}</button>
					<span class="hotkey-description">
						{hotkeys[hotkey].description}
					</span>
				</div>
			{/each}
		</div>
	</section>
</dialog>

<style lang="postcss">
	section {
		height: 100%;
	}

	.hotkeys {
		display: grid;
		grid-gap: 20px;
		padding: 20px;
	}

	.hotkey-container {
		display: flex;
		align-items: center;
		gap: 20px;
	}
	header {
		--border: var(--fg);
		border-bottom: solid 4px var(--border);
		display: flex;
		justify-content: center;
		position: sticky;
		top: 0;
		z-index: 10;
	}

	header:focus-within {
		--border: var(--primary);
		background-color: var(--bg-sheet);
	}

	.close {
		position: absolute;
		top: 10px;
		right: 10px;
	}

	dialog {
		--search-height: 40vh;
		padding: 0;
		background-color: var(--bg-1);
		height: var(--search-height);
		border: var(--border);
		border-color: var(--fg);
		border-radius: var(--brad);

		max-width: 100%;
		width: 100%;
		@media (--above-med) {
			width: clamp(600px, 40vw, 950px);
		}
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.8);
	}
</style>
