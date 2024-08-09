<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import Dump from './Dump.svelte';
	export let data: PageData;
	export let form: ActionData;
	let formRef: HTMLFormElement | null = null;
	$: ({ show } = data);

	$: if (form) {
		formRef?.scrollIntoView({
			behavior: 'smooth',
		});
	}
</script>

<h1 class="h4">DB dump</h1>
<p>This is the data that is currently in the DB. No caches.</p>
{#if show}
	<Dump data={show} />
{/if}
<h1 class="h4">AI Show Notes</h1>
{#if show?.aiShowNote}
	<form class="flex flex-col" method="POST" bind:this={formRef}>
		{#if form?.message}
			<div class="errors">
				{form?.message}
			</div>
		{/if}
		<label for="title">Title</label>
		<input name="title" id="title" value={show?.aiShowNote.title} />
		<label for="description">Description</label>
		<textarea name="description" id="description" rows={4} value={show?.aiShowNote.description}></textarea>
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
		color: red;
	}
</style>
