<script lang="ts">
	import Dump from './Dump.svelte';

	let { data, form } = $props();
	let formRef: HTMLFormElement | null = $state(null);
	let { show } = $derived(data);

	$effect(() => {
		if (form) {
			formRef?.scrollIntoView({
				behavior: 'smooth'
			});
		}
	});
</script>

<h1 class="h4">DB dump</h1>
<p>This is the data that is currently in the DB. No caches.</p>
{#if show}
	<Dump data={show} />
{/if}
<div class="spotify-sync">
	<h2 class="h5">Spotify Sync</h2>
	<p>Sync Spotify data for this episode</p>
	{#if form?.message}
		<div class="sync-message" class:error={!form?.success} class:success={form?.success}>
			{form.message}
		</div>
	{/if}
	<form method="POST" action="?/sync_spotify">
		<button type="submit">Sync Spotify</button>
	</form>
</div>

<h1 class="h4">AI Show Notes</h1>
{#if show?.aiShowNote}
	<form class="flex flex-col" method="POST" action="?/update_ai_show_note" bind:this={formRef}>
		{#if form?.message}
			<div class="errors">
				{form?.message}
			</div>
		{/if}
		<label for="title">Title</label>
		<input name="title" id="title" value={show?.aiShowNote.title} />
		<label for="description">Description</label>
		<textarea name="description" id="description" rows={4} value={show?.aiShowNote.description}
		></textarea>
		<button>Update</button>
	</form>
	<Dump data={show?.aiShowNote} />
{:else}
	<p>Notes not available</p>
{/if}

<style>
	form {
		margin: 1rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.errors {
		color: var(--c-red);
	}
	.spotify-sync {
		margin: 2rem 0;
		padding: 1rem;
		border: 1px solid var(--fg);
		border-radius: 0.5rem;
	}
	.spotify-sync h2 {
		margin: 0 0 0.5rem 0;
	}
	.spotify-sync p {
		margin: 0 0 1rem 0;
	}
	.sync-message {
		padding: 0.5rem;
		margin: 0.5rem 0;
		border-radius: 0.25rem;
	}
	.sync-message.error {
		background-color: #fee;
		border: 1px solid #f88;
		color: #c00;
	}
	.sync-message.success {
		background-color: #efe;
		border: 1px solid #8f8;
		color: #060;
	}
</style>
