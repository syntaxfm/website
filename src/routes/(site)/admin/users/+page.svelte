<script lang="ts">
	import { format } from 'date-fns';
	import { goto } from '$app/navigation';
	import { page as current_page } from '$app/state';
	import AdminActions from '../AdminActions.svelte';
	import AdminSearch from '../AdminSearch.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import { build_url, read_int, read_string } from '$lib/admin/admin_filters';
	import { bulk_assign_role, bulk_remove_role, list_roles, list_users } from './admin_users.remote';

	const PAGE_SIZE = 25;

	let search_text = $derived(read_string(current_page.url.searchParams, 'q'));
	let page_number = $derived(read_int(current_page.url.searchParams, 'page', 1, { min: 1 }));

	let selected_user_ids = $state<string[]>([]);
	let bulk_role_id = $state('');
	let action_message = $state('');
	let action_error = $state('');
	let busy = $state(false);

	type RoleOption = { id: string; name: string };
	let role_options = $state<RoleOption[]>([]);

	type UsersListResult = Awaited<ReturnType<typeof list_users>>;
	type UserListItem = UsersListResult['items'][number];

	async function load_role_options() {
		try {
			const result = await list_roles();
			role_options = result.map((role_item) => ({ id: role_item.id, name: role_item.name }));
			if (!bulk_role_id && role_options.length > 0) {
				bulk_role_id = role_options[0].id;
			}
		} catch (error) {
			console.error('Unable to load role options', error);
		}
	}

	void load_role_options();

	const list_result = await list_users({
		search_text: search_text || undefined,
		page: page_number,
		page_size: PAGE_SIZE
	});

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

	async function run_bulk_assign() {
		clear_feedback();

		if (selected_user_ids.length === 0) {
			action_error = 'Select at least one user first.';
			return;
		}

		if (!bulk_role_id) {
			action_error = 'Select a role first.';
			return;
		}

		busy = true;

		try {
			const result = await bulk_assign_role({
				user_ids: selected_user_ids,
				role_id: bulk_role_id
			});
			const role_name =
				role_options.find((role_item) => role_item.id === bulk_role_id)?.name ?? 'role';
			action_message = `Assigned ${role_name} to ${result.count} user(s).`;
			selected_user_ids = [];
			await list_users({
				search_text: search_text || undefined,
				page: page_number,
				page_size: PAGE_SIZE
			}).refresh();
		} catch (error) {
			console.error(error);
			action_error = 'Unable to assign role. Please try again.';
		} finally {
			busy = false;
		}
	}

	async function run_bulk_remove() {
		clear_feedback();

		if (selected_user_ids.length === 0) {
			action_error = 'Select at least one user first.';
			return;
		}

		if (!bulk_role_id) {
			action_error = 'Select a role first.';
			return;
		}

		busy = true;

		try {
			await bulk_remove_role({
				user_ids: selected_user_ids,
				role_id: bulk_role_id
			});
			const role_name =
				role_options.find((role_item) => role_item.id === bulk_role_id)?.name ?? 'role';
			action_message = `Removed ${role_name} from ${selected_user_ids.length} user(s).`;
			selected_user_ids = [];
			await list_users({
				search_text: search_text || undefined,
				page: page_number,
				page_size: PAGE_SIZE
			}).refresh();
		} catch (error) {
			console.error(error);
			action_error = 'Unable to remove role. Please try again.';
		} finally {
			busy = false;
		}
	}

	function format_roles(user_row: UserListItem) {
		if (user_row.roles.length === 0) {
			return '-';
		}
		return user_row.roles.map((user_role_item) => user_role_item.role.name).join(', ');
	}

	let role_select_options = $derived(
		role_options.map((role_item) => ({ value: role_item.id, label: role_item.name }))
	);

	let bulk_role_label = $derived(
		role_options.find((role_item) => role_item.id === bulk_role_id)?.name ?? 'Select role'
	);
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<div class="split" style="flex-wrap: wrap">
		<h1 class="h3">Users</h1>
		<AdminActions>
			<a class="button small" href="/admin/users/roles">Roles</a>
		</AdminActions>
	</div>

	<AdminList
		total={list_result.total}
		page={list_result.page}
		page_size={list_result.page_size}
		total_pages={list_result.total_pages}
		on_page_change={(next) => update_url({ page: next > 1 ? next : null })}
		bind:selected_ids={selected_user_ids}
		visible_ids={list_result.items.map((item) => item.id)}
		{busy}
	>
		{#snippet filters()}
			<AdminSearch
				text={search_text}
				on_input={(value) => update_url({ q: value || null, page: null })}
				placeholder="Search users"
			/>
		{/snippet}

		{#snippet bulk()}
			<div
				class="flex"
				style="

--flex-gap: var(--pad-small);

 flex-wrap: wrap; align-items: center"
			>
				<SelectMenu
					popover_id="filter-bulk_role"
					button_text={`Role (${bulk_role_label})`}
					value={bulk_role_id}
					options={role_select_options}
					onselect={(value) => (bulk_role_id = value)}
				/>
				<button type="button" onclick={run_bulk_assign} disabled={busy || !bulk_role_id}>
					Assign role
				</button>
				<button type="button" onclick={run_bulk_remove} disabled={busy || !bulk_role_id}>
					Remove role
				</button>
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

		{#snippet table_head({ all_visible_selected, indeterminate, toggle_all_visible })}
			<th>
				<input
					type="checkbox"
					aria-label="Select all rows on this page"
					checked={all_visible_selected}
					{indeterminate}
					onchange={(event) => {
						const target = event.currentTarget;
						if (!(target instanceof HTMLInputElement)) return;
						toggle_all_visible(target.checked);
					}}
				/>
			</th>
			<th>Name / Email</th>
			<th>Roles</th>
			<th>Created</th>
		{/snippet}

		{#snippet table_body({ toggle_selected, is_selected })}
			{#each list_result.items as user_row (user_row.id)}
				<tr>
					<td>
						<input
							type="checkbox"
							aria-label={`Select ${user_row.username || user_row.email || user_row.id}`}
							checked={is_selected(user_row.id)}
							onchange={(event) => {
								const target = event.currentTarget;
								if (!(target instanceof HTMLInputElement)) return;
								toggle_selected(user_row.id, target.checked);
							}}
						/>
					</td>
					<td>
						<div class="stack" style:--stack-gap="var(--pad-xsmall)">
							<p>{user_row.username || '-'}</p>
							{#if user_row.name}
								<p class="fs-2">{user_row.name}</p>
							{/if}
							{#if user_row.email}
								<p class="fs-2">{user_row.email}</p>
							{/if}
							<a href={`/admin/users/${user_row.id}`}>Edit</a>
						</div>
					</td>
					<td>{format_roles(user_row)}</td>
					<td>
						{#if user_row.created_at}
							{format(user_row.created_at, 'MMM d, yyyy')}
						{:else}
							-
						{/if}
					</td>
				</tr>
			{/each}
		{/snippet}

		{#snippet empty()}
			<tr>
				<td colspan="4">No matching users found.</td>
			</tr>
		{/snippet}
	</AdminList>
</div>
