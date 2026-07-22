<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page as current_page } from '$app/state';
	import AdminList from '$lib/admin/AdminList.svelte';
	import { build_url, has_any_filter, read_int, read_string } from '$lib/admin/admin_filters';
	import AdminSearch from '../AdminSearch.svelte';
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

	const list_result = $derived(
		await list_guests({
			search_text,
			page: page_number,
			page_size: PAGE_SIZE
		})
	);

	function update_url(updates: Record<string, string | number | null | undefined>) {
		void goto(build_url(current_page.url, updates), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
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
			await goto(resolve(`/admin/guests/${created.id}`));
		} catch (error) {
			console.error('Unable to create guest', error);
			action_error = error instanceof Error ? error.message : 'Unable to create guest.';
		} finally {
			creating_guest = false;
		}
	}
</script>

<svelte:head>
	<title>Guests | Syntax Admin</title>
</svelte:head>

<div class="admin-page stack">
	<form class="admin-inline-form admin-actions" onsubmit={handle_create_guest}>
		<label class="admin-visually-hidden" for="new-guest-name">Guest name</label>
		<input
			id="new-guest-name"
			type="text"
			bind:value={new_guest_name}
			placeholder="New guest name"
			required
			disabled={creating_guest}
		/>
		<button type="submit" data-intent="primary" disabled={creating_guest}>
			{creating_guest ? 'Creating…' : 'Create guest'}
		</button>
	</form>

	<AdminList
		total={list_result.total}
		page={list_result.page}
		page_size={list_result.page_size}
		total_pages={list_result.total_pages}
		on_page_change={(next) => update_url({ page: next > 1 ? next : null })}
		bind:selected_ids={selected_guest_ids}
		visible_ids={list_result.items.map((item) => item.id)}
		{busy}
	>
		{#snippet filters()}
			<div class="admin-field">
				<AdminSearch
					text={search_text}
					on_input={(value) => update_url({ q: value || null, page: null })}
					placeholder="Search guests"
				/>
				{#if show_clear_filters}
					<div class="admin-control-row">
						<a class="button" data-intent="quiet" href={resolve('/admin/guests')}>× Clear</a>
					</div>
				{/if}
			</div>
		{/snippet}

		{#snippet action_feedback()}
			{#if action_message}
				<p class="admin-feedback" data-tone="positive" role="status">{action_message}</p>
			{/if}
			{#if action_error}
				<p class="admin-feedback" data-tone="negative" role="alert">{action_error}</p>
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
			{#each list_result.items as guest_row (guest_row.id)}
				<tr>
					<td>
						<a href={resolve(`/admin/guests/${guest_row.id}`)}>{guest_row.name}</a>
					</td>
					<td>/{guest_row.name_slug}</td>
					<td>
						{#if guest_row.twitter}
							<a
								href={`https://twitter.com/${guest_row.twitter}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								@{guest_row.twitter}
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
								{guest_row.github}
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
</div>
