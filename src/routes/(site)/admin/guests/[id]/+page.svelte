<script lang="ts">
	import { goto } from '$app/navigation';
	import { page as current_page } from '$app/state';
	import SlugEditor from '$lib/admin/SlugEditor.svelte';
	import { format } from 'date-fns';
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

	let saving = $state(false);
	let deleting = $state(false);
	let adding_link = $state(false);
	let status_message = $state('');
	let status_error = $state('');

	function clear_feedback() {
		status_message = '';
		status_error = '';
	}

	async function refresh_social_links() {
		const refreshed = await get_guest_detail(guest_id);
		social_links = (refreshed?.socialLinks ?? []).map((row) => ({ id: row.id, link: row.link }));
	}

	async function save_guest() {
		if (!loaded_guest) {
			status_error = 'Guest not found.';
			return;
		}

		saving = true;
		clear_feedback();

		try {
			await update_guest({
				id: loaded_guest.id,
				name,
				name_slug,
				twitter: twitter.trim() || null,
				github: github.trim() || null,
				url: url.trim() || null,
				of: of.trim() || null
			});
			status_message = 'Guest updated.';
		} catch (error) {
			console.error('Unable to save guest', error);
			status_error = error instanceof Error ? error.message : 'Unable to save guest.';
		} finally {
			saving = false;
		}
	}

	async function handle_delete_guest() {
		if (!loaded_guest) {
			status_error = 'Guest not found.';
			return;
		}

		clear_feedback();
		const confirm_text = window.prompt('Type DELETE to confirm deleting this guest');
		if (confirm_text !== 'DELETE') {
			status_message = 'Delete cancelled.';
			return;
		}

		deleting = true;

		try {
			await delete_guest({ guest_id: loaded_guest.id, confirm_text });
			await goto('/admin/guests');
		} catch (error) {
			console.error('Unable to delete guest', error);
			status_error = error instanceof Error ? error.message : 'Unable to delete guest.';
		} finally {
			deleting = false;
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

{#if !loaded_guest}
	<div class="stack" style:--stack-gap="var(--pad-small)">
		<h1 class="h3">Guest not found</h1>
		<p><a href="/admin/guests">Back to guests</a></p>
	</div>
{:else}
	<div class="stack" style:--stack-gap="var(--pad-small)">
		<h1 class="h3">Edit Guest</h1>

		<form
			class="stack readable"
			style:--stack-gap="var(--pad-small)"
			onsubmit={(event) => {
				event.preventDefault();
				void save_guest();
			}}
		>
			<label class="stack" style:--stack-gap="0.35rem">
				<span class="fs-2">Name</span>
				<input type="text" bind:value={name} required />
			</label>

			<SlugEditor bind:title={name} bind:slug={name_slug} label="Name slug" />

			<label class="stack" style:--stack-gap="0.35rem">
				<span class="fs-2">Title</span>
				<input type="text" bind:value={of} placeholder="e.g. Senior Engineer at Acme" />
			</label>

			<label class="stack" style:--stack-gap="0.35rem">
				<span class="fs-2">Twitter handle</span>
				<input type="text" bind:value={twitter} placeholder="username (no @)" />
			</label>

			<label class="stack" style:--stack-gap="0.35rem">
				<span class="fs-2">GitHub handle</span>
				<input type="text" bind:value={github} placeholder="username" />
			</label>

			<label class="stack" style:--stack-gap="0.35rem">
				<span class="fs-2">Website URL</span>
				<input type="url" bind:value={url} placeholder="https://example.com" />
			</label>

			<button type="submit" disabled={saving || deleting}>
				{saving ? 'Saving...' : 'Save Guest'}
			</button>
		</form>

		{#if status_message}
			<p class="fs-2" style="color: var(--c-green)">{status_message}</p>
		{/if}

		{#if status_error}
			<p class="fs-2" style="color: var(--c-red)">{status_error}</p>
		{/if}

		<section class="stack" style:--stack-gap="var(--pad-small)">
			<h2 class="h5">Social links</h2>

			{#if social_links.length === 0}
				<p class="fs-2">No social links yet.</p>
			{:else}
				<ul class="no-list stack" style:--stack-gap="var(--pad-xsmall)">
					{#each social_links as social_link_row (social_link_row.id)}
						<li class="split" style:--split-gap="var(--pad-small)">
							<a href={social_link_row.link} target="_blank" rel="noopener noreferrer">
								{social_link_row.link}
							</a>
							<button type="button" onclick={() => handle_remove_social_link(social_link_row.id)}>
								Remove
							</button>
						</li>
					{/each}
				</ul>
			{/if}

			<form class="flex" style:--flex-gap="var(--pad-xsmall)" onsubmit={handle_add_social_link}>
				<input
					type="url"
					bind:value={new_social_link}
					placeholder="https://example.com/profile"
					disabled={adding_link}
				/>
				<button type="submit" disabled={adding_link || new_social_link.trim().length === 0}>
					{adding_link ? 'Adding...' : 'Add link'}
				</button>
			</form>
		</section>

		<section class="stack" style:--stack-gap="var(--pad-small)">
			<h2 class="h5">Shows</h2>

			{#if loaded_guest.shows.length === 0}
				<p class="fs-2">No shows yet.</p>
			{:else}
				<ul class="no-list stack" style:--stack-gap="var(--pad-xsmall)">
					{#each loaded_guest.shows as show_row (show_row.number)}
						<li class="split" style:--split-gap="var(--pad-small)">
							<span class="flex" style:--flex-gap="var(--pad-xsmall)">
								<span class="fs-2">#{show_row.number}</span>
								<a href={`/admin/content/podcast/${show_row.number}`}>{show_row.title}</a>
							</span>
							<span class="flex" style:--flex-gap="var(--pad-small)">
								<span class="fs-2">{format(show_row.date, 'MMM d, yyyy')}</span>
								<a
									href={`/show/${show_row.number}/${show_row.slug}`}
									target="_blank"
									rel="noopener noreferrer"
								>
									View
								</a>
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="stack" style:--stack-gap="var(--pad-small)">
			<h2 class="h5">Danger zone</h2>
			<div class="flex" style:--flex-gap="var(--pad-small)">
				<button type="button" onclick={handle_delete_guest} disabled={saving || deleting}>
					{deleting ? 'Deleting...' : 'Delete Guest'}
				</button>
				<a href="/admin/guests">Back to guests</a>
			</div>
		</section>
	</div>
{/if}
