<script lang="ts">
	import { clickOutDialog } from '$actions/click_outside_dialog';
	import { episode_share_status } from '$state/player';
	import type { Show } from '$server/db/schema';
	import ShareActions from './ShareActions.svelte';
	let modal: HTMLDialogElement = $state(null!);
	interface Props {
		show: Show;
		timestamp?: boolean;
	}

	let { show, timestamp = true }: Props = $props();

	async function close() {
		$episode_share_status = false;
	}

	$effect(() => {
		if ($episode_share_status) {
			if (modal) {
				modal.showModal();
			}
		} else {
			if (modal) {
				modal.close();
			}
		}
	});
</script>

<dialog
	bind:this={modal}
	class="zone"
	style:--c-bg="var(--c-bg)"
	style:--c-fg="var(--c-fg)"
	use:clickOutDialog
	onclose={close}
	onclick-outside={close}
	aria-labelledby="share-header"
>
	<h2 class="h3" id="share-header">Share</h2>
	<section aria-label="Share Window">
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
		background: rgb(0 0 0 / 0.8);
	}
</style>
