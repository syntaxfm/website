<script lang="ts">
	import { run } from 'svelte/legacy';

	import { clickOutDialog } from '$/actions/click_outside_dialog';
	import { episode_share_status, player } from '$/state/player';
	import type { Show } from '@prisma/client';
	import ShareActions from './ShareActions.svelte';
	let modal: HTMLDialogElement = $state();
	interface Props {
		show: Show;
		timestamp?: boolean;
	}

	let { show, timestamp = true }: Props = $props();

	async function close() {
		$episode_share_status = false;
	}

	run(() => {
		if ($episode_share_status) {
			if (modal) {
				modal.showModal();
			}
		}
	});

	run(() => {
		if (!$episode_share_status) {
			if (modal) {
				modal.close();
			}
		}
	});
</script>

<dialog
	bind:this={modal}
	class="zone"
	style:--bg="var(--bg-sheet)"
	style:--fg="var(--fg-sheet)"
	use:clickOutDialog
	onclose={close}
	onclick-outside={close}
	aria-labelledby="share-header"
>
	<h2 class="h3" id="share-header">Share</h2>
	<section aria-label="Share Window" class="share-window">
		<button onclick={close} class="close" aria-label="close">×</button>
		<ShareActions {timestamp} {show} />
	</section>
</dialog>

<style lang="postcss">
	.close {
		position: absolute;
		top: 10px;
		right: 10px;
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.8);
	}
</style>
