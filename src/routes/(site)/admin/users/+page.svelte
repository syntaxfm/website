<script lang="ts">
	import AdminSearch from '../AdminSearch.svelte';
	import { list_users } from './admin_users.remote';

	interface UserRow {
		id: string;
		username: string | null;
		name: string | null;
		email: string | null;
		roles: Array<{
			role: {
				id: string;
				name: string;
			};
		}>;
	}

	let search_text = $state('');

	let users = $derived(
		(await list_users({ search_text: search_text.trim() || undefined })) as UserRow[]
	);
</script>

<h1 class="h3">Users</h1>

<AdminSearch bind:text={search_text} />

<div class="table-container">
	<table>
		<thead>
			<tr>
				<th>Username</th>
				<th>Name</th>
				<th>Email</th>
				<th>Roles</th>
				<th>Action</th>
			</tr>
		</thead>
		<tbody>
			{#if !users}
				<tr>
					<td colspan="5">Loading users...</td>
				</tr>
			{:else if users.length === 0}
				<tr>
					<td colspan="5">No users found.</td>
				</tr>
			{:else}
				{#each users as user_item (user_item.id)}
					<tr>
						<td>{user_item.username || '-'}</td>
						<td>{user_item.name || '-'}</td>
						<td>{user_item.email || '-'}</td>
						<td>
							{#if user_item.roles.length === 0}
								-
							{:else}
								{user_item.roles.map((user_role) => user_role.role.name).join(', ')}
							{/if}
						</td>
						<td>
							<a href={`/admin/users/${user_item.id}`}>Open</a>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
