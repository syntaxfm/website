<script lang="ts">
	import AdminActions from '$/lib/AdminActions.svelte';
	import FormButton from '$/lib/FormButton.svelte';
</script>

<h1 class="h4">Youtube Playlists</h1>

<AdminActions>
	<FormButton text="Sync Playlists" thinking_text="Syncing..." action_path="?/import" />
</AdminActions>

<p class="small">
	Playlists listed here are what exists on Youtube, if you need to import or update a specific
	playlist select import/update
</p>
