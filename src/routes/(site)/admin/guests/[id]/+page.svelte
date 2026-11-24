<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page as current_page } from '$app/state';
	import AdminConfirmDialog from '#lib/admin/AdminConfirmDialog.svelte';
	import AdminDateCell from '#lib/admin/AdminDateCell.svelte';
	import AdminEditorHeader from '#lib/admin/AdminEditorHeader.svelte';
	import AdminTable from '#lib/admin/AdminTable.svelte';
	import AdminTitleCell from '#lib/admin/AdminTitleCell.svelte';
	import SlugEditor from '#lib/admin/SlugEditor.svelte';
	import { create_autosave_controller } from '#lib/utils/autosave.svelte.ts';
	import {
		add_social_link,
		delete_guest,
		get_guest_detail,
		remove_social_link,
		update_guest
	} from '../admin_guests.remote';

	const guest_id = (current_page.params as Record<string, string>).id ?? '';
	const loaded_guest = await get_guest_detail(guest_id);

	let name = $state(loaded_guest?.name ?? '');
	let name_slug = $state(loaded_guest?.name_slug ?? '');
	let twitter = $state(loaded_guest?.twitter ?? '');
	let github = $state(loaded_guest?.github ?? '');
	let url = $state(loaded_guest?.url ?? '');
	let of = $state(loaded_guest?.of ?? '');

	type SocialLinkRow = { id: string; link: string };
	let social_links = $state<SocialLinkRow[]>(
		(loaded_guest?.socialLinks ?? []).map((row) => ({ id: row.id, link: row.link }))
	);
	let new_social_link = $state('');

	let adding_link = $state(false);
	let status_error = $state('');

	interface GuestPayload {
		id: string;
		name: string;
		name_slug: string;
		twitter: string | null;
		github: string | null;
		url: string | null;
		of: string | null;
	}

	const autosave = create_autosave_controller<GuestPayload>(async (payload) => {
		try {
			await update_guest(payload);
		} catch (error) {
			console.error('Unable to autosave guest', error);
			throw error;
		}
	});

	onDestroy(() => autosave.cleanup());

	function clear_feedback() {
		status_error = '';
	}

	function create_guest_payload(): GuestPayload | null {
		if (!loaded_guest) {
			return null;
		}

		return {
			id: loaded_guest.id,
			name,
			name_slug,
			twitter: twitter.trim() || null,
			github: github.trim() || null,
			url: url.trim() || null,
			of: of.trim() || null
		};
	}

	function schedule_save(): void {
		const payload = create_guest_payload();
		if (payload) {
			autosave.schedule(payload);
		}
	}

	function handle_slug_change(next_slug: string): void {
		name_slug = next_slug;
		schedule_save();
	}

	function handle_name_input(event: Event): void {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) {
			return;
		}

		name = target.value;
		schedule_save();
	}

	function handle_title_input(event: Event): void {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) {
			return;
		}

		of = target.value;
		schedule_save();
	}

	function handle_twitter_input(event: Event): void {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) {
			return;
		}

		twitter = target.value;
		schedule_save();
	}

	function handle_github_input(event: Event): void {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) {
			return;
		}

		github = target.value;
		schedule_save();
	}

	function handle_url_input(event: Event): void {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) {
			return;
		}

		url = target.value;
		schedule_save();
	}

	async function handle_submit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		schedule_save();
		await autosave.save_now();
	}

	async function refresh_social_links() {
		const refreshed = await get_guest_detail(guest_id);
		social_links = (refreshed?.socialLinks ?? []).map((row) => ({ id: row.id, link: row.link }));
	}

	async function handle_delete_guest() {
		if (!loaded_guest) {
			throw new Error('Guest not found.');
		}

		clear_feedback();
		await autosave.save_now();

		try {
			await delete_guest({ guest_id: loaded_guest.id, confirm_text: 'DELETE' });
			await goto(resolve('admin/guests'));
		} catch (error) {
			console.error('Unable to delete guest', error);
			status_error = error instanceof Error ? error.message : 'Unable to delete guest.';
			throw error;
		}
	}

	async function handle_add_social_link(event: Event) {
		event.preventDefault();
		if (!loaded_guest) {
			return;
		}

		const trimmed_link = new_social_link.trim();
		if (trimmed_link.length === 0) {
			return;
		}

		adding_link = true;
		clear_feedback();

		try {
			await add_social_link({ guest_id: loaded_guest.id, link: trimmed_link });
			new_social_link = '';
			await refresh_social_links();
		} catch (error) {
			console.error('Unable to add social link', error);
			status_error = error instanceof Error ? error.message : 'Unable to add social link.';
		} finally {
			adding_link = false;
		}
	}

	async function handle_remove_social_link(social_link_id: string) {
		clear_feedback();

		try {
			await remove_social_link({ social_link_id });
			await refresh_social_links();
		} catch (error) {
			console.error('Unable to remove social link', error);
			status_error = error instanceof Error ? error.message : 'Unable to remove social link.';
		}
	}
</script>

<svelte:head>
	<title
		>{loaded_guest
			? `Edit guest: ${loaded_guest.name} | Syntax Admin`
			: 'Guest not found | Syntax Admin'}</title
	>
</svelte:head>

{#if !loaded_guest}
	<div class="admin-page stack">
		<p class="admin-feedback" data-tone="negative" role="alert">Guest not found.</p>
	</div>
{:else}
	<div class="admin-page stack">
		<AdminEditorHeader
			title={name}
			detail={`/guest/${name_slug}`}
			public_href={resolve(`guest/${name_slug}`)}
			{autosave}
		/>

		{#if status_error}
			<p class="admin-feedback" data-tone="negative" role="alert">{status_error}</p>
		{/if}

		<div class="admin-editor-layout">
			<div class="admin-editor-main">
				<form class="admin-editor stack" onsubmit={handle_submit}>
					<div class="admin-field">
						<label for="guest-name">Name</label>
						<input
							id="guest-name"
							name="name"
							type="text"
							bind:value={name}
							oninput={handle_name_input}
							required
						/>
					</div>

					<SlugEditor
						bind:title={name}
						bind:slug={name_slug}
						label="Name slug"
						onchange={handle_slug_change}
					/>

					<div class="admin-field">
						<label for="guest-title">Title</label>
						<input
							id="guest-title"
							name="of"
							type="text"
							bind:value={of}
							placeholder="Senior Engineer at Acme"
							oninput={handle_title_input}
						/>
					</div>
				</form>

				<section class="admin-field" aria-labelledby="social-links-heading">
					<h2 id="social-links-heading" class="admin-field-label">Social links</h2>
					<ul class="admin-pick-list">
						{#each social_links as social_link_row (social_link_row.id)}
							<li>
								<a href={social_link_row.link} target="_blank" rel="noopener noreferrer external">
									{social_link_row.link}
								</a>
								<button
									type="button"
									data-intent="danger"
									onclick={() => handle_remove_social_link(social_link_row.id)}
								>
									Remove
								</button>
							</li>
						{/each}
					</ul>
					<form class="admin-inline-form" onsubmit={handle_add_social_link}>
						<label class="admin-visually-hidden" for="new-social-link">Social link URL</label>
						<input
							id="new-social-link"
							type="url"
							bind:value={new_social_link}
							placeholder="https://example.com/profile"
							disabled={adding_link}
						/>
						<button type="submit" disabled={adding_link || new_social_link.trim().length === 0}>
							{adding_link ? 'Adding…' : 'Add link'}
						</button>
					</form>
				</section>
			</div>

			<aside class="admin-metadata-rail" aria-label="Handles">
				<div class="admin-field">
					<label for="guest-twitter">Twitter</label>
					<input
						id="guest-twitter"
						name="twitter"
						type="text"
						bind:value={twitter}
						placeholder="username"
						oninput={handle_twitter_input}
					/>
				</div>

				<div class="admin-field">
					<label for="guest-github">GitHub</label>
					<input
						id="guest-github"
						name="github"
						type="text"
						bind:value={github}
						placeholder="username"
						oninput={handle_github_input}
					/>
				</div>

				<div class="admin-field">
					<label for="guest-url">Website</label>
					<input
						id="guest-url"
						name="url"
						type="url"
						bind:value={url}
						placeholder="https://example.com"
						oninput={handle_url_input}
					/>
				</div>
			</aside>
		</div>

		<section class="admin-panel" aria-labelledby="guest-shows-heading">
			<h2 id="guest-shows-heading">Shows</h2>
			<AdminTable is_empty={loaded_guest.shows.length === 0}>
				{#snippet head()}
					<th>#</th>
					<th>Title</th>
					<th>Date</th>
				{/snippet}
				{#each loaded_guest.shows as show_row (show_row.number)}
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
					<tr><td colspan="3" class="admin-cell-muted">No shows yet.</td></tr>
				{/snippet}
			</AdminTable>
		</section>

		<div class="admin-actions">
			<AdminConfirmDialog
				title="Delete guest?"
				description="This permanently deletes the guest and their social links."
				action_label="Delete guest"
				onconfirm={handle_delete_guest}
			/>
		</div>
	</div>
{/if}
