<script lang="ts">
	import { formatDistance } from 'date-fns';
	import type { PageData } from './$types';
	import { queryParameters } from 'sveltekit-search-params';
	import SelectMenu from '$/lib/SelectMenu.svelte';
	import FormWithLoader from '$/lib/FormWithLoader.svelte';
	const store = queryParameters<{
		submission_type?: string;
		status?: string;
		perPage?: string;
		order?: 'ASC' | 'DESC';
		page: string;
	}>();

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let { submissions, submission_count, user_submission_status, user_submission_type } =
		$derived(data);
</script>

<h1 class="h4">Submissions ({submission_count})</h1>

<div class="submission-filter">
	<nav>
		<SelectMenu
			popover_id="filter-submission_type"
			onselect={(e) => {
				$store.submission_type = e.detail;
			}}
			button_text={`Type ${$store.submission_type ? `(${$store.submission_type})` : ''}`}
			button_icon="filter"
			value={$store.submission_type || ''}
			options={[
				{ value: '', label: 'All' },
				...Object.keys(user_submission_type).map((key) => ({ value: key, label: key }))
			]}
		/>
		<SelectMenu
			popover_id="filter-status"
			onselect={(e) => {
				$store.status = e.detail;
			}}
			button_text={`Status ${$store.status ? `(${$store.status})` : ''}`}
			button_icon="filter"
			value={$store.status || ''}
			options={[
				{ value: '', label: 'All' },
				...Object.keys(user_submission_status).map((key) => ({ value: key, label: key }))
			]}
		/>
		<SelectMenu
			popover_id="filter-perPage"
			onselect={(e) => {
				$store.perPage = e.detail;
			}}
			value_as_label
			button_text="Per Page"
			value={$store.perPage?.toString() || '100'}
			options={[
				{ value: '10', label: '10' },
				{ value: '20', label: '20' },
				{ value: '40', label: '40' },
				{ value: '100', label: '100' }
			]}
		/>
		<SelectMenu
			popover_id="filter-order"
			onselect={(e) => {
				$store.order = e.detail;
			}}
			value={$store.order || 'desc'}
			button_text="Sort"
			button_icon="sort"
			options={[
				{ value: 'desc', label: 'Newest To Oldest' },
				{ value: 'asc', label: 'Oldest To Newest' }
			]}
		/>
		<a class="button subtle" href="/admin/submissions">× Clear</a>
	</nav>
</div>

<div class="submissions">
	{#if !submissions}
		<p>No Submissions found</p>
	{:else}
		{#each submissions as submission}
			<div class="submission" style:--transition-name="submission-{submission.id}">
				<h4>
					From {submission.name || 'Anon'}
					<span class="pill"
						>{formatDistance(new Date(submission.created_at), new Date(), {
							addSuffix: true
						})}</span
					>
					<span class="pill">{submission.submission_type}</span>
					<span class="pill">{submission.email || 'No Email'}</span>
					<span class="pill">{submission.status}</span>
				</h4>

				<textarea class="submission_body"
					>{submission.body.replaceAll('\n', '\n\n').trim()}
				</textarea>
				<footer>
					<FormWithLoader global={false} action="?/update_submission" method="post">
						{#snippet children({ loading })}
							<select
								name="status"
								id="status"
								value={submission.status}
								onchange={(e) => {
									e.currentTarget.form?.requestSubmit();
								}}
							>
								<option value="PENDING">PENDING</option>
								<option value="APPROVED">APPROVED</option>
								<option value="COMPLETED">COMPLETED</option>
								<option value="REJECTED">REJECTED</option>
							</select>
							<input type="hidden" name="id" value={submission.id} />
							<button style:display="none" type="submit">{loading ? 'Updating' : 'Update'}</button>
						{/snippet}
					</FormWithLoader>
					<FormWithLoader
						global={false}
						confirm="Are you sure you want to delete this submission?"
						action="?/delete_submission"
						method="post"
					>
						{#snippet children({ loading })}
							<input type="hidden" name="id" value={submission.id} />
							<button class="warning" type="submit">{loading ? 'Deleting' : 'Delete'}</button>
						{/snippet}
					</FormWithLoader>
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
		display: grid;
		gap: 1rem;
		view-transition-name: var(--transition-name);
	}

	footer {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}
	.submission_body {
		max-height: 400px;
		overflow-x: auto;
		white-space: pre-wrap;
		overflow-wrap: break-word;
		field-sizing: content;
		border: none;
	}
	.pill {
		font-size: 12px;
		background: var(--subtle);
		padding: 2px 5px;
		border-radius: 5px;
	}
	nav {
		display: flex;
		gap: 1rem;
		padding: 1rem 0;
	}
	footer {
		border-top: 2px solid var(--fg);
		display: grid;
		padding-top: 1rem;
		grid-auto-flow: column;
		grid-auto-columns: max-content;
		gap: 1rem;
		justify-content: end;
		place-items: center;
	}
</style>
