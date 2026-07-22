<script lang="ts">
	import { format } from 'date-fns';
	import {
		import_remote_playlists,
		get_remote_playlists,
		import_playlist
	} from '../admin_videos.remote';
	import AdminSearch from '../../../AdminSearch.svelte';
	import AdminList from '$lib/admin/AdminList.svelte';

	interface ActionFeedback {
		tone: 'positive' | 'negative';
		message: string;
	}

	const initial_playlist_data = await get_remote_playlists();

	let search_text = $state('');
	let playlists = $state.raw(initial_playlist_data.playlists);
	let local_playlists = $state.raw(initial_playlist_data.local_playlists);
	let is_syncing_playlists = $state(false);
	let sync_feedback = $state<ActionFeedback | null>(null);
	let pending_playlist_ids = $state<string[]>([]);
	let playlist_feedback = $state<Record<string, ActionFeedback | undefined>>({});

	let filtered_playlists = $derived.by(() => {
		const query = search_text.toLowerCase();
		if (!query) return playlists;

		return playlists.filter((playlist) => playlist.title.toLowerCase().includes(query));
	});

	async function refresh_playlists(): Promise<void> {
		await get_remote_playlists().refresh();
		const next_playlist_data = await get_remote_playlists();
		playlists = next_playlist_data.playlists;
		local_playlists = next_playlist_data.local_playlists;
	}

	async function sync_playlists(): Promise<void> {
		if (is_syncing_playlists) {
			return;
		}

		is_syncing_playlists = true;
		sync_feedback = null;

		try {
			const result = await import_remote_playlists();
			if (result.success === false) {
				throw new Error(result.message);
			}

			await refresh_playlists();
			sync_feedback = { tone: 'positive', message: result.message };
		} catch (error) {
			console.error('Unable to sync YouTube playlists', error);
			sync_feedback = {
				tone: 'negative',
				message: error instanceof Error ? error.message : 'Unable to sync YouTube playlists.'
			};
		} finally {
			is_syncing_playlists = false;
		}
	}

	async function import_youtube_playlist(playlist_id: string): Promise<void> {
		if (pending_playlist_ids.includes(playlist_id)) {
			return;
		}

		pending_playlist_ids = [...pending_playlist_ids, playlist_id];
		playlist_feedback[playlist_id] = undefined;

		try {
			const result = await import_playlist(playlist_id);
			if (result.success === false) {
				throw new Error(result.message);
			}

			await refresh_playlists();
			playlist_feedback[playlist_id] = { tone: 'positive', message: result.message };
		} catch (error) {
			console.error(`Unable to import YouTube playlist ${playlist_id}`, error);
			playlist_feedback[playlist_id] = {
				tone: 'negative',
				message: error instanceof Error ? error.message : 'Unable to import playlist.'
			};
		} finally {
			pending_playlist_ids = pending_playlist_ids.filter(
				(pending_playlist_id) => pending_playlist_id !== playlist_id
			);
		}
	}
</script>

<svelte:head>
	<title>Import YouTube Playlists | Syntax Admin</title>
</svelte:head>

<div class="admin-page stack">
	<div class="admin-control-row">
		<button
			type="button"
			data-intent="primary"
			onclick={sync_playlists}
			disabled={is_syncing_playlists}
		>
			{is_syncing_playlists ? 'Syncing…' : 'Sync playlists'}
		</button>
		{#if sync_feedback}
			<p
				class="admin-feedback"
				data-tone={sync_feedback.tone}
				role={sync_feedback.tone === 'negative' ? 'alert' : 'status'}
			>
				{sync_feedback.message}
			</p>
		{/if}
	</div>

	<AdminList
		total={filtered_playlists.length}
		page={1}
		page_size={filtered_playlists.length}
		total_pages={1}
		on_page_change={() => {}}
		visible_ids={filtered_playlists.map((playlist) => playlist.playlist_id)}
	>
		{#snippet filters()}
			<AdminSearch
				text={search_text}
				on_input={(value) => {
					search_text = value;
				}}
			/>
		{/snippet}

		{#snippet table_head()}
			<th>Title</th>
			<th>Videos</th>
			<th>Published</th>
			<th>ID</th>
			<th>Action</th>
		{/snippet}

		{#snippet table_body()}
			{#each filtered_playlists as playlist (playlist.playlist_id)}
				{@const feedback = playlist_feedback[playlist.playlist_id]}
				<tr>
					<td>
						{playlist.title}
					</td>
					<td>
						{playlist.videos_count}
					</td>
					<td>
						{format(playlist.created_at, 'MMM d, yyyy')}
					</td>
					<td class="center">
						{playlist.playlist_id}
					</td>
					<td>
						<div class="admin-control">
							<button
								type="button"
								data-intent="primary"
								onclick={() => import_youtube_playlist(playlist.playlist_id)}
								disabled={pending_playlist_ids.includes(playlist.playlist_id)}
							>
								{pending_playlist_ids.includes(playlist.playlist_id)
									? 'Importing…'
									: local_playlists.includes(playlist.playlist_id)
										? 'Sync playlist'
										: 'Link to local'}
							</button>
							{#if feedback}
								<p
									class="admin-feedback"
									data-tone={feedback.tone}
									role={feedback.tone === 'negative' ? 'alert' : 'status'}
								>
									{feedback.message}
								</p>
							{/if}
						</div>
					</td>
				</tr>
			{/each}
		{/snippet}

		{#snippet empty()}
			<tr>
				<td colspan="5">No playlists found.</td>
			</tr>
		{/snippet}
	</AdminList>
</div>
