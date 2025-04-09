<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import Dump from './Dump.svelte';
	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();
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
<h1 class="h4">AI Show Notes</h1>
{#if show?.aiShowNote}
	<form class="flex" method="POST" bind:this={formRef}>
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
		color: red;
	}

	/* a[href^='#t='] {
		background: var(--bg-1);
		padding: 4px 6px;
		border-bottom: none;
		text-decoration: none;
		color: var(--color-2);
		border-radius: 4px;
		position: relative;
		font-size: var(--font-size-sm);
		font-variation-settings: var(--fv-800);

		@media (--above-med) {
			left: -17px;
		}
	} 
	 .show-notes {
		h2,
		h3 {
			font-size: var(--font-size-lg);
		}

		ul {
			padding-left: 20px;
		}
	} */
</style>
