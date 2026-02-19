<script lang="ts">
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

<div class="stack" style:--stack-gap="var(--pad-small)">
	<h1 class="h3">Roles</h1>

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

	{#if status_message}
		<p>{status_message}</p>
	{/if}

	{#if status_error}
		<p>{status_error}</p>
	{/if}

	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Name</th>
				</tr>
			</thead>
			<tbody>
				{#if roles.length === 0}
					<tr>
						<td>No roles found.</td>
					</tr>
				{:else}
					{#each roles as role_item (role_item.id)}
						<tr>
							<td>{role_item.name}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
