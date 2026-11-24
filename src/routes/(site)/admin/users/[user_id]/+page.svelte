<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import AdminDateCell from '#lib/admin/AdminDateCell.svelte';
	import AdminEditorHeader from '#lib/admin/AdminEditorHeader.svelte';
	import AdminTable from '#lib/admin/AdminTable.svelte';
	import AdminTitleCell from '#lib/admin/AdminTitleCell.svelte';
	import StatusBadge from '#lib/admin/StatusBadge.svelte';
	import {
		add_user_role,
		get_user_detail,
		list_roles,
		remove_user_role
	} from '../admin_users.remote';

	interface RoleItem {
		id: string;
		name: string;
	}
	interface ShowHostedRow {
		number: number;
		slug: string;
		title: string;
		date: Date;
	}

	interface ArticleAuthoredRow {
		id: string;
		title: string;
		slug: string;
		status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		updated_at: Date;
		published_at: Date | null;
	}

	interface UserDetail {
		id: string;
		username: string | null;
		name: string | null;
		email: string | null;
		roles: Array<{
			role: RoleItem;
		}>;
		shows_hosted: ShowHostedRow[];
		articles_authored: ArticleAuthoredRow[];
	}

	const user_id = (page.params as Record<string, string>).user_id ?? '';

	let user_detail = $state((await get_user_detail(user_id)) as UserDetail | null);
	let all_roles = $state((await list_roles()) as RoleItem[]);
	let selected_role_id = $state('');

	let saving = $state(false);
	let status_message = $state('');
	let status_error = $state('');

	let assigned_role_ids = $derived(new Set((user_detail?.roles ?? []).map((item) => item.role.id)));

	let available_roles = $derived(
		all_roles.filter((role_item) => !assigned_role_ids.has(role_item.id))
	);

	function clear_feedback() {
		status_message = '';
		status_error = '';
	}

	function sync_selected_role() {
		const has_selected = available_roles.some((role_item) => role_item.id === selected_role_id);
		if (has_selected) {
			return;
		}

		selected_role_id = available_roles[0]?.id ?? '';
	}

	async function refresh_detail() {
		user_detail = (await get_user_detail(user_id)) as UserDetail | null;
		all_roles = (await list_roles()) as RoleItem[];
		sync_selected_role();
	}

	sync_selected_role();

	async function add_role() {
		if (!user_detail) {
			status_error = 'User not found.';
			return;
		}

		if (!selected_role_id) {
			status_error = 'Select a role first.';
			return;
		}

		saving = true;
		clear_feedback();

		try {
			await add_user_role({
				user_id: user_detail.id,
				role_id: selected_role_id
			});
			await refresh_detail();
			status_message = 'Role added.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to add role.';
		} finally {
			saving = false;
		}
	}

	async function handle_add_role(event: SubmitEvent) {
		event.preventDefault();
		await add_role();
	}

	async function remove_role(role_id: string) {
		if (!user_detail) {
			status_error = 'User not found.';
			return;
		}

		saving = true;
		clear_feedback();

		try {
			await remove_user_role({
				user_id: user_detail.id,
				role_id
			});
			await refresh_detail();
			status_message = 'Role removed.';
		} catch (error) {
			console.error(error);
			status_error = error instanceof Error ? error.message : 'Unable to remove role.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title
		>{user_detail
			? `${user_detail.username || user_detail.name || user_detail.email || user_detail.id} | Syntax Admin`
			: 'User not found | Syntax Admin'}</title
	>
</svelte:head>

{#if !user_detail}
	<div class="admin-page stack">
		<p class="admin-feedback" data-tone="negative" role="alert">User not found.</p>
	</div>
{:else}
	{@const user_label =
		user_detail.username || user_detail.name || user_detail.email || user_detail.id}
	<div class="admin-page stack">
		<AdminEditorHeader
			back_href={resolve('admin/users')}
			back_label="Users"
			title={user_label}
			detail={[user_detail.name, user_detail.email]
				.filter((part) => part && part !== user_label)
				.join(' · ')}
		/>

		{#if status_message}
			<p class="admin-feedback" data-tone="positive" role="status">{status_message}</p>
		{/if}
		{#if status_error}
			<p class="admin-feedback" data-tone="negative" role="alert">{status_error}</p>
		{/if}

		<div class="admin-editor-layout">
			<div class="admin-editor-main">
				<section class="admin-panel" aria-labelledby="shows-heading">
					<h2 id="shows-heading">Shows hosted</h2>
					<AdminTable is_empty={user_detail.shows_hosted.length === 0}>
						{#snippet head()}
							<th>#</th>
							<th>Title</th>
							<th>Date</th>
						{/snippet}
						{#each user_detail.shows_hosted as show_row (show_row.number)}
							<tr>
								<td class="admin-cell-muted">#{show_row.number}</td>
								<AdminTitleCell
									title={show_row.title}
									edit_href={resolve(`admin/content/podcast/${show_row.number}`)}
									public_href={resolve(`show/${show_row.number}/${show_row.slug}`)}
								/>
								<AdminDateCell value={show_row.date} />
							</tr>
						{/each}
						{#snippet empty()}
							<tr><td colspan="3" class="admin-cell-muted">No shows hosted yet.</td></tr>
						{/snippet}
					</AdminTable>
				</section>

				<section class="admin-panel" aria-labelledby="articles-heading">
					<h2 id="articles-heading">Articles</h2>
					<AdminTable is_empty={user_detail.articles_authored.length === 0}>
						{#snippet head()}
							<th>Title</th>
							<th>Status</th>
							<th>Updated</th>
						{/snippet}
						{#each user_detail.articles_authored as article_row (article_row.id)}
							<tr>
								<AdminTitleCell
									title={article_row.title}
									edit_href={resolve(`admin/content/articles/${article_row.id}`)}
								/>
								<td><StatusBadge status={article_row.status} /></td>
								<AdminDateCell value={article_row.updated_at} />
							</tr>
						{/each}
						{#snippet empty()}
							<tr><td colspan="3" class="admin-cell-muted">No articles yet.</td></tr>
						{/snippet}
					</AdminTable>
				</section>
			</div>

			<aside class="admin-metadata-rail" aria-labelledby="roles-heading">
				<h2 id="roles-heading" class="admin-field-label">Roles</h2>
				<ul class="admin-pick-list">
					{#each user_detail.roles as user_role (user_role.role.id)}
						<li>
							{user_role.role.name}
							<button
								type="button"
								data-intent="quiet"
								onclick={() => remove_role(user_role.role.id)}
								disabled={saving}
							>
								Remove
							</button>
						</li>
					{:else}
						<li class="admin-cell-muted">No roles</li>
					{/each}
				</ul>
				{#if available_roles.length > 0}
					<form class="admin-inline-form" onsubmit={handle_add_role}>
						<label class="admin-visually-hidden" for="add-role">Role</label>
						<select id="add-role" bind:value={selected_role_id} disabled={saving}>
							{#each available_roles as role_item (role_item.id)}
								<option value={role_item.id}>{role_item.name}</option>
							{/each}
						</select>
						<button type="submit" disabled={saving || !selected_role_id}>Add role</button>
					</form>
				{/if}
			</aside>
		</div>
	</div>
{/if}
