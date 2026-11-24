<script lang="ts">
	import AdminList from '#lib/admin/AdminList.svelte';
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
	<form
		class="admin-inline-form admin-actions"
		onsubmit={(event) => {
			event.preventDefault();
			void add_role();
		}}
	>
		<label class="admin-field">
			<span>Role name</span>
			<input type="text" bind:value={role_name} placeholder="editor" required />
		</label>
		<button type="submit" data-intent="primary" disabled={creating}>
			{creating ? 'Creating...' : 'Add role'}
		</button>
	</form>

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
