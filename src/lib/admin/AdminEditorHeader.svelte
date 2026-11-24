<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '#lib/Icon.svelte';
	import type { AutosaveState } from '#lib/utils/autosave.svelte.ts';
	import AdminSaveStatus from './AdminSaveStatus.svelte';

	// The parts of an autosave controller the header shows
	interface SaveState {
		readonly state: AutosaveState;
		readonly error_message: string;
		retry(): Promise<void>;
	}

	interface Props {
		// The list this item belongs to
		back_href: string;
		back_label: string;
		title: string;
		// A muted line under the title, such as "#1051 · Podcast"
		detail?: string;
		// Where it lives in public, opened from an icon beside the title
		public_href?: string | null;
		// Shows whether edits are saved
		autosave?: SaveState;
		// Page actions, such as Sync Spotify
		actions?: Snippet;
		// Jump links to the editor's sections, kept in reach in the header
		sections?: { id: string; label: string }[];
	}

	let { back_href, back_label, title, detail, public_href, autosave, actions, sections }: Props =
		$props();
</script>

<header class="admin-editor-header">
	<a class="admin-editor-back" href={back_href}>← {back_label}</a>
	<h1>
		{title || 'Untitled'}
		{#if public_href}
			<a
				class="admin-link-out"
				href={public_href}
				target="_blank"
				rel="noopener noreferrer external"
				aria-label={`Open ${title} in public`}
			>
				<Icon name="link-out" />
			</a>
		{/if}
	</h1>
	{#if detail}
		<p>{detail}</p>
	{/if}
	<div class="admin-editor-header-end">
		{#if autosave}
			<AdminSaveStatus
				state={autosave.state}
				error_message={autosave.error_message}
				onretry={() => autosave.retry()}
			/>
		{/if}
		{@render actions?.()}
	</div>
	{#if sections?.length}
		<nav class="admin-section-nav" aria-label="Sections">
			{#each sections as section (section.id)}
				<a href={`#${section.id}`}>{section.label}</a>
			{/each}
		</nav>
	{/if}
</header>
