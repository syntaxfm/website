<script lang="ts">
	import { formatDistance } from 'date-fns';
	import { page } from '$app/state';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import {
		delete_submission,
		get_submissions,
		update_submission_status
	} from './admin_submissions.remote';

	type SubmissionsResult = Awaited<ReturnType<typeof get_submissions>>;

	type RowState = {
		updating: boolean;
		deleting: boolean;
	};

	let row_state_by_id = $state<Record<string, RowState>>({});
	let submissions = $state<SubmissionsResult['submissions']>([]);
	let submission_count = $state(0);
	let user_submission_type_values = $state<string[]>([]);
	let user_submission_status_values = $state<string[]>([]);
	let is_loading = $state(false);
	let load_error = $state<string | null>(null);
	let last_loaded_query_string = $state<string>('');

	const params = $derived(page.url.searchParams);
	const active_submission_type = $derived(params.get('submission_type') ?? '');
	const active_status = $derived(params.get('status') ?? '');
	const active_per_page = $derived(params.get('perPage') ?? '100');
	const active_order = $derived.by(() => {
		const order = params.get('order');
		return order === 'asc' || order === 'desc' ? order : 'desc';
	});
	const show_clear_filters = $derived(
		active_submission_type !== '' ||
			active_status !== '' ||
			active_per_page !== '100' ||
			active_order !== 'desc'
	);

	function get_per_page_value() {
		const parsed_per_page = Number.parseInt(active_per_page, 10);
		if (!Number.isFinite(parsed_per_page) || parsed_per_page < 1) {
			return 100;
		}

		return parsed_per_page;
	}

	async function load_submissions() {
		const query_string = page.url.searchParams.toString();
		is_loading = true;
		load_error = null;

		try {
			const result = await get_submissions({
				submission_type: active_submission_type,
				status: active_status,
				per_page: get_per_page_value(),
				order: active_order
			});

			submissions = result.submissions;
			submission_count = result.submission_count;
			user_submission_type_values = result.user_submission_type;
			user_submission_status_values = result.user_submission_status;
			last_loaded_query_string = query_string;
		} catch (error) {
			console.error(error);
			load_error = 'Unable to load submissions';
			submissions = [];
			submission_count = 0;
		} finally {
			is_loading = false;
		}
	}

	await load_submissions();

	$effect(() => {
		const query_string = page.url.searchParams.toString();
		if (query_string === last_loaded_query_string) return;

		void load_submissions();
	});

	function update_row_state(submission_id: string, next: Partial<RowState>) {
		const current = row_state_by_id[submission_id] ?? { updating: false, deleting: false };
		row_state_by_id[submission_id] = { ...current, ...next };
	}

	async function set_submission_status(submission_id: string, status: string) {
		update_row_state(submission_id, { updating: true });
		try {
			await update_submission_status({ id: submission_id, status });
			submissions = submissions.map((s) =>
				s.id === submission_id ? { ...s, status: status as (typeof s)['status'] } : s
			);
			// If a status filter is active and this submission no longer matches, remove it
			if (active_status && status !== active_status) {
				submissions = submissions.filter((s) => s.id !== submission_id);
				submission_count--;
			}
		} catch (error) {
			console.error(error);
		} finally {
			update_row_state(submission_id, { updating: false });
		}
	}

	async function remove_submission(submission_id: string) {
		if (!window.confirm('Are you sure you want to delete this submission?')) return;

		update_row_state(submission_id, { deleting: true });
		try {
			await delete_submission({ id: submission_id });
			submissions = submissions.filter((s) => s.id !== submission_id);
			submission_count--;
		} catch (error) {
			console.error(error);
		} finally {
			update_row_state(submission_id, { deleting: false });
		}
	}
</script>

<h1 class="h3">Submissions ({is_loading ? '...' : submission_count})</h1>

<div>
	<nav>
		<SelectMenu
			popover_id="filter-submission_type"
			button_text={`Type ${active_submission_type ? `(${active_submission_type})` : ''}`}
			button_icon={'filter' as any}
			value={active_submission_type}
			options={[
				{ value: '', label: 'All' },
				...user_submission_type_values.map((enum_value) => ({
					value: enum_value,
					label: enum_value
				}))
			]}
		/>
		<SelectMenu
			popover_id="filter-status"
			button_text={`Status ${active_status ? `(${active_status})` : ''}`}
			button_icon={'filter' as any}
			value={active_status}
			options={[
				{ value: '', label: 'All' },
				...user_submission_status_values.map((enum_value) => ({
					value: enum_value,
					label: enum_value
				}))
			]}
		/>
		<SelectMenu
			popover_id="filter-perPage"
			value_as_label
			button_text="Per Page"
			value={active_per_page}
			options={[
				{ value: '10', label: '10' },
				{ value: '20', label: '20' },
				{ value: '40', label: '40' },
				{ value: '100', label: '100' }
			]}
		/>
		<SelectMenu
			popover_id="filter-order"
			value={active_order}
			button_text="Sort"
			button_icon={'sort' as any}
			options={[
				{ value: 'desc', label: 'Newest To Oldest' },
				{ value: 'asc', label: 'Oldest To Newest' }
			]}
		/>
		{#if show_clear_filters}
			<a class="button" href="/admin/submissions">× Clear</a>
		{/if}
	</nav>
</div>

<div class="submissions">
	{#if load_error}
		<p>{load_error}</p>
	{:else if is_loading}
		<p>Loading submissions...</p>
	{:else if submissions.length === 0}
		<p>No Submissions found</p>
	{:else}
		{#each submissions as submission (submission.id)}
			{@const row_state = row_state_by_id[submission.id] ?? { updating: false, deleting: false }}
			{@const row_busy = row_state.updating || row_state.deleting}
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

				<textarea class="submission-body"
					>{submission.body.replaceAll('\n', '\n\n').trim()}
				</textarea>
				<footer>
					<SelectMenu
						popover_id="status-{submission.id}"
						button_text={submission.status}
						value={submission.status}
						disabled={row_busy}
						options={user_submission_status_values.map((s) => ({
							value: s,
							label: s
						}))}
						onselect={(status) => {
							void set_submission_status(submission.id, status);
						}}
					/>
					<button
						class="warning"
						type="button"
						disabled={row_busy}
						onclick={() => {
							void remove_submission(submission.id);
						}}
					>
						{row_state.deleting ? 'Deleting' : 'Delete'}
					</button>
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
		overflow-wrap: break-word;
	}

	.submission {
		border: 1px solid var(--c-fg);
		padding: 2rem;
		max-width: 100%;
		display: grid;
		gap: 1rem;
		view-transition-name: var(--transition-name);
	}

	footer {
		flex-wrap: wrap;
		border-top: 2px solid var(--c-fg);
		display: grid;
		padding-top: 1rem;
		grid-auto-flow: column;
		grid-auto-columns: max-content;
		gap: 1rem;
		justify-content: end;
		place-items: center;
	}

	.submission-body {
		max-height: 400px;
		overflow-x: auto;
		white-space: pre-wrap;
		overflow-wrap: break-word;
		field-sizing: content;
		border: none;
	}

	.pill {
		font-size: var(--fs-1);
		background: var(--c-black-1);
		padding: 2px 5px;
		border-radius: 5px;
	}

	nav {
		display: flex;
		gap: 1rem;
		padding: 1rem 0;
	}
</style>
