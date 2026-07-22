<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { format } from 'date-fns';
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
	<div class="admin-page stack">
		<section class="admin-section" aria-labelledby="profile-heading">
			<h2 id="profile-heading" class="h5">Profile</h2>
			<dl class="admin-source-facts">
				<dt>Username</dt>
				<dd>{user_detail.username || '-'}</dd>
				<dt>Name</dt>
				<dd>{user_detail.name || '-'}</dd>
				<dt>Email</dt>
				<dd>{user_detail.email || '-'}</dd>
			</dl>
		</section>

		<section class="admin-section" aria-labelledby="roles-heading">
			<h2 id="roles-heading" class="h5">Roles</h2>
			<form class="admin-inline-form" onsubmit={handle_add_role}>
				<label class="admin-field">
					<span>Role</span>
					<select bind:value={selected_role_id} disabled={available_roles.length === 0 || saving}>
						{#if available_roles.length === 0}
							<option value="">No roles available</option>
						{:else}
							{#each available_roles as role_item (role_item.id)}
								<option value={role_item.id}>{role_item.name}</option>
							{/each}
						{/if}
					</select>
				</label>
				<button
					type="submit"
					data-intent="primary"
					disabled={saving || available_roles.length === 0 || !selected_role_id}
				>
					Add role
				</button>
			</form>

			{#if user_detail.roles.length === 0}
				<p>No roles assigned.</p>
			{:else}
				<ul class="no-list">
					{#each user_detail.roles as user_role (user_role.role.id)}
						<li class="admin-row admin-control-row">
							<span>{user_role.role.name}</span>
							<div class="admin-actions">
								<button
									type="button"
									data-intent="danger"
									onclick={() => remove_role(user_role.role.id)}
									disabled={saving}
								>
									Remove
								</button>
							</div>
						</li>
					{/each}
				</ul>
			{/if}

			{#if status_message}
				<p class="admin-feedback" data-tone="positive" role="status">{status_message}</p>
			{/if}
			{#if status_error}
				<p class="admin-feedback" data-tone="negative" role="alert">{status_error}</p>
			{/if}
		</section>

		<section class="admin-section" aria-labelledby="shows-heading">
			<h2 id="shows-heading" class="h5">Shows hosted</h2>
			{#if user_detail.shows_hosted.length === 0}
				<p class="fs-2">No shows hosted yet.</p>
			{:else}
				<ul class="no-list">
					{#each user_detail.shows_hosted as show_row (show_row.number)}
						<li class="admin-row admin-control-row">
							<div class="admin-control-row">
								<span class="fs-2">#{show_row.number}</span>
								<a href={resolve(`/admin/content/podcast/${show_row.number}`)}>{show_row.title}</a>
							</div>
							<div class="admin-actions">
								<span class="fs-2">{format(show_row.date, 'MMM d, yyyy')}</span>
								<a
									class="button"
									data-intent="quiet"
									href={resolve(`/show/${show_row.number}/${show_row.slug}`)}
									target="_blank"
									rel="noopener noreferrer"
								>
									View
								</a>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="admin-section" aria-labelledby="articles-heading">
			<h2 id="articles-heading" class="h5">Articles authored</h2>
			{#if user_detail.articles_authored.length === 0}
				<p class="fs-2">No articles yet.</p>
			{:else}
				<ul class="no-list">
					{#each user_detail.articles_authored as article_row (article_row.id)}
						<li class="admin-row admin-control-row">
							<a href={resolve(`/admin/content/articles/${article_row.id}`)}>{article_row.title}</a>
							<div class="admin-actions">
								<span class="fs-2">{article_row.status}</span>
								<span class="fs-2">{format(article_row.updated_at, 'MMM d, yyyy')}</span>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
{/if}
