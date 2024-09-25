<script lang="ts">
	import AdminActions from '$/lib/AdminActions.svelte';
	import { enhance } from '$app/forms';
	import { form_action } from '$lib/form_action';
	import { format, formatDistance, subDays } from 'date-fns';
	import Dump from '../shows/[show_number]/Dump.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ submissions } = data);
</script>

<h1 class="h4">Submissions</h1>

<div class="submissions">
	{#if !submissions}
		<p>No Submissions found</p>
	{:else}
		{#each submissions as submission}
			<div class="submission">
				<h4>
					From {submission.name || 'Anon'}
					<span class="pill"
						>{formatDistance(subDays(new Date(submission.created_at), 3), new Date(), {
							addSuffix: true
						})}</span
					>
					<span class="pill">{submission.submission_type}</span>
					<span class="pill">{submission.email || 'No Email'}</span>
					<span class="pill">{submission.status}</span>
				</h4>

				<div class="submission_body">
					{submission.body}
				</div>
				<footer>
					<button class="danger">Delete</button>
					<select name="status" id="status">
						<option value="PENDING">PENDING</option>
						<option value="APPROVED">APPROVED</option>
						<option value="COMPLETED">COMPLETED</option>
						<option value="REJECTED">REJECTED</option>
					</select>
				</footer>
			</div>
		{/each}
	{/if}
</div>

<style>
	.submissions {
		display: grid;
		gap: 2rem;
		grid-template-columns: minmax(0, 1fr);
	}
	h4 {
		word-wrap: break-word;
	}
	.submission {
		border: 1px solid var(--fg);
		padding: 2rem;
		max-width: 100%;
	}
	.submission_body {
		max-height: 200px;
		overflow-x: auto;
		white-space: pre-wrap;
		overflow-wrap: break-word;
	}
	.pill {
		font-size: 12px;
		background: var(--subtle);
		padding: 2px 5px;
		border-radius: 5px;
	}
</style>
