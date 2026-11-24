<script lang="ts">
	import AdminList from '#lib/admin/AdminList.svelte';
	import AdminPageHeader from '#lib/admin/AdminPageHeader.svelte';
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

<svelte:head>
	<title>Roles | Syntax Admin</title>
</svelte:head>

<div class="admin-page stack">
	<AdminPageHeader title="Roles">
		{#snippet actions()}
			<form
				class="admin-inline-form"
				onsubmit={(event) => {
					event.preventDefault();
					void add_role();
				}}
			>
				<label class="admin-visually-hidden" for="new-role-name">Role name</label>
				<input
					id="new-role-name"
					type="text"
					bind:value={role_name}
					placeholder="New role name"
					required
				/>
				<button type="submit" data-intent="primary" disabled={creating}>
					{creating ? 'Adding…' : 'Add role'}
				</button>
			</form>
		{/snippet}
	</AdminPageHeader>

	<AdminList
		total={roles.length}
		visible_ids={roles.map((role_item) => role_item.id)}
		message={status_message}
		error={status_error}
	>
		{#snippet table_head()}
			<th>Name</th>
		{/snippet}

		{#snippet table_body()}
			{#each roles as role_item (role_item.id)}
				<tr>
					<td class="admin-cell-title">{role_item.name}</td>
				</tr>
			{/each}
		{/snippet}

		{#snippet empty()}
			<tr>
				<td class="admin-cell-muted">No roles yet.</td>
			</tr>
		{/snippet}
	</AdminList>
</div>
