<script lang="ts">
	import { goto } from '$app/navigation';
	import { page as current_page } from '$app/state';
	import AdminSearch from '../AdminSearch.svelte';
	import AdminActions from '../AdminActions.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';
	import { build_url, has_any_filter, read_int, read_string } from '$lib/admin/admin_filters';
	import { create_guest, list_guests } from './admin_guests.remote';

	const FILTER_KEYS = ['q'] as const;
	const PAGE_SIZE = 25;

	let search_text = $derived(read_string(current_page.url.searchParams, 'q'));
	let page_number = $derived(read_int(current_page.url.searchParams, 'page', 1, { min: 1 }));
	let show_clear_filters = $derived(has_any_filter(current_page.url.searchParams, FILTER_KEYS));

	let selected_guest_ids = $state<string[]>([]);
	let busy = $state(false);
	let action_message = $state('');
	let action_error = $state('');

	let new_guest_name = $state('');
	let creating_guest = $state(false);

	function get_list_guests_query() {
		return list_guests({
			search_text,
			page: page_number,
			page_size: PAGE_SIZE
		});
	}

	let list_result_promise = $derived.by(() => get_list_guests_query());

	function update_url(updates: Record<string, string | number | null | undefined>) {
		void goto(build_url(current_page.url, updates), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function on_search_input(next_value: string) {
		update_url({ q: next_value || null, page: null });
	}

	function on_page_change(next_page: number) {
		update_url({ page: next_page > 1 ? next_page : null });
	}

	function clear_feedback() {
		action_message = '';
		action_error = '';
	}

	async function handle_create_guest(event: Event) {
		event.preventDefault();
		clear_feedback();

		const trimmed_name = new_guest_name.trim();
		if (trimmed_name.length === 0) {
			action_error = 'Name is required.';
			return;
		}

		creating_guest = true;

		try {
			const created = await create_guest({ name: trimmed_name });
			new_guest_name = '';
			await goto(`/admin/guests/${created.id}`);
		} catch (error) {
			console.error('Unable to create guest', error);
			action_error = error instanceof Error ? error.message : 'Unable to create guest.';
		} finally {
			creating_guest = false;
		}
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<h1 class="h3">Guests</h1>

	<AdminActions>
		<form
			class="flex"
			style:--flex-gap="var(--pad-xsmall)"
			onsubmit={handle_create_guest}
		>
			<input
				type="text"
				bind:value={new_guest_name}
				placeholder="New guest name"
				required
				disabled={creating_guest}
			/>
			<button type="submit" disabled={creating_guest}>
				{creating_guest ? 'Creating...' : 'Create Guest'}
			</button>
		</form>
	</AdminActions>

	{#await list_result_promise}
		<p class="fs-2">Loading guests...</p>
	{:then list_result}
		{@const list_items = list_result.items}
		{@const visible_ids = list_items.map((item) => item.id)}

		<AdminList
			total={list_result.total}
			page={list_result.page}
			page_size={list_result.page_size}
			total_pages={list_result.total_pages}
			{on_page_change}
			bind:selected_ids={selected_guest_ids}
			{visible_ids}
			{busy}
		>
			{#snippet filters()}
				<div class="stack" style:--stack-gap="var(--pad-small)">
					<AdminSearch text={search_text} on_input={on_search_input} placeholder="Search guests" />
					{#if show_clear_filters}
						<div class="flex" style:--flex-gap="var(--pad-small)">
							<a class="button small" href="/admin/guests">× Clear</a>
						</div>
					{/if}
				</div>
			{/snippet}

			{#snippet action_feedback()}
				{#if action_message}
					<p class="fs-2" style="color: var(--c-green)">{action_message}</p>
				{/if}
				{#if action_error}
					<p class="fs-2" style="color: var(--c-red)">{action_error}</p>
				{/if}
			{/snippet}

			{#snippet table_head()}
				<th>Name</th>
				<th>Slug</th>
				<th>Twitter</th>
				<th>GitHub</th>
				<th>Title</th>
			{/snippet}

			{#snippet table_body()}
				{#each list_items as guest_row (guest_row.id)}
					<tr>
						<td>
							<a href={`/admin/guests/${guest_row.id}`}>{guest_row.name}</a>
						</td>
						<td>/{guest_row.name_slug}</td>
						<td>
							{#if guest_row.twitter}
								<a
									href={`https://twitter.com/${guest_row.twitter}`}
									target="_blank"
									rel="noopener noreferrer"
								>
									[↗]
								</a>
							{:else}
								-
							{/if}
						</td>
						<td>
							{#if guest_row.github}
								<a
									href={`https://github.com/${guest_row.github}`}
									target="_blank"
									rel="noopener noreferrer"
								>
									[↗]
								</a>
							{:else}
								-
							{/if}
						</td>
						<td>{guest_row.of || '-'}</td>
					</tr>
				{/each}
			{/snippet}

			{#snippet empty()}
				<tr>
					<td colspan="5">No matching guests found.</td>
				</tr>
			{/snippet}
		</AdminList>
	{:catch}
		<p class="fs-2" style="color: var(--c-red)">Unable to load guests. Please try again.</p>
	{/await}
</div>
