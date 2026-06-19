<script lang="ts">
	import AdminActions from '../../AdminActions.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';
	import { create_role, list_roles } from '../admin_users.remote';

	interface RoleItem {
		id: string;
		name: string;
	}

	let role_name = $state('');
	let creating = $state(false);

	let roles = $state((await list_roles()) as RoleItem[]);

	let status_message = $state('');
	let status_error = $state('');

	function clear_feedback() {
		status_message = '';
		status_error = '';
	}

	async function refresh_roles() {
		roles = (await list_roles()) as RoleItem[];
	}

	async function add_role() {
		const trimmed_name = role_name.trim();
		if (!trimmed_name) {
			status_error = 'Role name is required.';
			return;
		}

		creating = true;
		clear_feedback();

		try {
			await create_role({ name: trimmed_name });
			role_name = '';
			status_message = 'Role created.';
			await refresh_roles();
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to create role.';
		} finally {
			creating = false;
		}
	}
</script>

<div class="stack" style:--stack-gap="var(--pad-medium)">
	<div class="split" style="flex-wrap: wrap">
		<h1 class="h3">Roles</h1>
		<AdminActions>
			<form
				class="flex"
				style:--flex-gap="var(--pad-small)"
				onsubmit={(event) => {
					event.preventDefault();
					void add_role();
				}}
			>
				<label class="stack" style:--stack-gap="0.35rem">
					Role name
					<input type="text" bind:value={role_name} placeholder="editor" required />
				</label>
				<button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Add role'}</button>
			</form>
		</AdminActions>
	</div>

	<AdminList
		total={roles.length}
		page={1}
		page_size={roles.length}
		total_pages={1}
		on_page_change={() => {}}
		visible_ids={roles.map((role_item) => role_item.id)}
	>
		{#snippet action_feedback()}
			{#if status_message}
				<p>{status_message}</p>
			{/if}
			{#if status_error}
				<p>{status_error}</p>
			{/if}
		{/snippet}

		{#snippet table_head()}
			<th>Name</th>
		{/snippet}

		{#snippet table_body()}
			{#each roles as role_item (role_item.id)}
				<tr>
					<td>{role_item.name}</td>
				</tr>
			{/each}
		{/snippet}

		{#snippet empty()}
			<tr>
				<td>No roles found.</td>
			</tr>
		{/snippet}
	</AdminList>
</div>
