<script lang="ts">
	import { page } from '$app/state';
	import { slide } from 'svelte/transition';

	let links = [
		{
			text: 'Dashboard',
			path: '/admin'
		},
		{
			text: 'Submissions',
			path: '/admin/submissions'
		},
		{
			text: 'Content',
			path: '/admin/content',
			subroutes: [
				{
					text: 'Podcast',
					path: '/admin/content/podcast',
					subroutes: [
						{
							text: 'Transcripts',
							path: '/admin/content/podcast/transcripts'
						}
					]
				},
				{
					text: 'Video',
					path: '/admin/content/videos',
					subroutes: [
						{
							text: 'Import',
							path: '/admin/content/videos/import'
						}
					]
				},
				{
					text: 'Articles',
					path: '/admin/articles'
				}
			]
		},
		{
			text: 'Tags',
			path: '/admin/tags'
		},
		{
			text: 'Users',
			path: '/admin/users',
			subroutes: [
				{
					text: 'Roles',
					path: '/admin/users/roles'
				}
			]
		}
	];

	// Derive the active parent link based on current path
	let active_parent = $derived.by(() => {
		const current_path = page.url.pathname;

		// Find the link that matches the current path or whose subroutes include it
		return links.find((link) => {
			// Check if current path is exactly this link
			if (current_path === link.path) return true;

			// Check if current path is in any subroutes (recursively)
			if (link.subroutes) {
				return link.subroutes.some((subroute) => {
					if (current_path === subroute.path) return true;

					// Check nested subroutes
					if (subroute.subroutes) {
						return subroute.subroutes.some((nested) => current_path === nested.path);
					}

					return false;
				});
			}

			return false;
		});
	});

	// Derive the active second level subroute
	let active_subroute = $derived.by(() => {
		const current_path = page.url.pathname;

		if (!active_parent?.subroutes) return null;

		return active_parent.subroutes.find((subroute) => {
			if (current_path === subroute.path) return true;

			// Check if current path is in nested subroutes
			if (subroute.subroutes) {
				return subroute.subroutes.some((nested) => current_path === nested.path);
			}

			return false;
		});
	});

	// Derive whether to show subnav and what subroutes to show
	let active_subroutes = $derived(active_parent?.subroutes ?? []);
	let show_subnav = $derived(active_subroutes.length > 0);

	// Derive third level subroutes
	let active_nested_subroutes = $derived(active_subroute?.subroutes ?? []);
	let show_nested_subnav = $derived(active_nested_subroutes.length > 0);
</script>

<div class="admin-nav-wrapper">
	<div class="admin-menu flex">
		{#each links as link (link.path + 'admin-nav')}
			<a href={link.path} class:active={active_parent === link}>{link.text}</a>
		{/each}
	</div>

	{#if show_subnav}
		<div class="admin-submenu flex" transition:slide={{ duration: 200 }}>
			{#each active_subroutes as subroute (subroute.path + 'admin-subnav')}
				<a href={subroute.path} class:active={active_subroute === subroute}>{subroute.text}</a>
			{/each}
		</div>
	{/if}

	{#if show_nested_subnav}
		<div class="admin-nested-submenu flex" transition:slide={{ duration: 200 }}>
			{#each active_nested_subroutes as nested (nested.path + 'admin-nested-subnav')}
				<a href={nested.path} class:active={page.url.pathname === nested.path}>{nested.text}</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.admin-nav-wrapper {
		border-bottom: var(--c-fg-1) solid 1px;
	}

	.admin-menu {
		overflow: scroll;
		gap: 15px;
		padding: var(--pad-small) var(--pad-medium);
		flex-wrap: nowrap;
		a {
			white-space: nowrap;
		}
	}

	.admin-submenu,
	.admin-nested-submenu {
		overflow: scroll;
		gap: 15px;
		padding: var(--pad-small) var(--pad-medium);
		flex-wrap: nowrap;
		border-top: var(--c-fg-1) solid 1px;
		a {
			white-space: nowrap;
			font-size: 0.9em;
			opacity: 0.85;
			&:hover {
				text-decoration: underline;
				opacity: 1;
			}
			&.active {
				text-decoration: underline;
				opacity: 1;
			}
		}
	}
</style>
