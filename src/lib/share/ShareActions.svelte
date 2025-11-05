<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import { player } from '$state/player';
	import type { Show } from '$server/db/schema';
	import toast, { Toaster } from 'svelte-french-toast';

	interface Props {
		timestamp?: boolean;
		show: Show;
	}

	let { timestamp = true, show }: Props = $props();

	let share_at_ts = $state(false);

	const toHMS = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		// Formatting to ensure two digits for minutes and seconds
		const formattedMinutes = minutes.toString().padStart(2, '0');
		const formattedSeconds = secs.toString().padStart(2, '0');

		return `${hours}:${formattedMinutes}:${formattedSeconds}`;
	};

	function copy(link: string) {
		navigator.clipboard.writeText(decodeURIComponent(link));
		toast.success(`Copied show link to clipboard`);
	}
	function copy_embed() {
		navigator.clipboard.writeText(`
<iframe
	scrolling="no"
	src="https://syntax.fm/embed/${show.number}"
	title="Show Embed"
	style="width: 100%; height: 230px; max-width: 1200px; border: 1px solid var(--c-black)"
/>
		`);
		toast.success(
			`Copied embed HTML to clipboard, if you post, let us know, we're happy to share.`
		);
	}

	let time_stamp = $derived(
		share_at_ts && $player?.audio?.currentTime
			? `%3Ft%3D${toHMS(Math.trunc($player.audio?.currentTime))}`
			: ``
	);
	let share_url = $derived(`https%3A//syntax.fm/${show.number}${time_stamp}`);
</script>

{#if timestamp}
	<p>
		<label>
			<input bind:checked={share_at_ts} type="checkbox" />
			Start at timestamp:
		</label>
		<input type="text" value={toHMS(Math.trunc($player?.audio?.currentTime || 0))} />
	</p>
{/if}
<Toaster />
<button onclick={copy_embed} aria-label="Copy Embed Code for this show"
	><Icon name="code" /> Embed</button
>
<button onclick={() => copy(share_url)} aria-label="Copy link to this show"
	><Icon name="link" /> Link</button
>
<a
	class="button share-x"
	target="_blank"
	href="https://twitter.com/intent/tweet?url={share_url}&text={show.title}&via=syntaxfm"
	aria-label="Share on Twitter"><Icon name="twitter" /></a
>
<a
	class="button share-facebook"
	target="_blank"
	aria-label="Share on Facebook"
	href="https://facebook.com/sharer/sharer.php?u={share_url}&quote={show.title}"
	><Icon name="facebook" /> Facebook</a
>
<a
	target="_blank"
	class="button share-linkedin"
	aria-label="Share on LinkedIn"
	href="https://www.linkedin.com/sharing/share-offsite/?url={share_url}"
	><Icon name="linkedin" /> LinkedIn</a
>

<style lang="postcss">
	.share-x {
		--button-bg: linear-gradient(to bottom, var(--c-black-7) 0%, var(--c-black-8) 100%);
		--button-fg: var(--c-white);
	}

	.share-facebook {
		--button-bg: linear-gradient(to bottom, #57b1f9 0%, #2d64f6 100%);
		--button-fg: var(--c-white);
	}

	.share-linkedin {
		--button-bg: linear-gradient(to bottom, #57b1f9 0%, #2d64bc 100%);
		--button-fg: var(--c-white);
	}
</style>
