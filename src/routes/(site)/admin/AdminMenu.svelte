<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';

	type NavLink = { text: string; path: Pathname; subroutes?: NavLink[] };

	const links: NavLink[] = [
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
						},
						{
							text: 'Playlists',
							path: '/admin/content/videos/playlists'
						}
					]
				},
				{
					text: 'Articles',
					path: '/admin/content/articles'
				}
			]
		},
		{
			text: 'Tags',
			path: '/admin/tags'
		},
		{
			text: 'Guests',
			path: '/admin/guests'
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

	function path_matches(link_path: Pathname, current_path: string): boolean {
		return (
			current_path === link_path ||
			(link_path !== '/admin' && current_path.startsWith(`${link_path}/`))
		);
	}

	// Derive the active parent link based on current path
	let active_parent = $derived.by(() => {
		const current_path = page.url.pathname;

		// Find the link that matches the current path or whose subroutes include it
		return links.find((link) => {
			// Check if current path is exactly this link
			if (path_matches(link.path, current_path)) return true;

			// Check if current path is in any subroutes (recursively)
			if (link.subroutes) {
				return link.subroutes.some((subroute) => {
					if (path_matches(subroute.path, current_path)) return true;

					// Check nested subroutes
					if (subroute.subroutes) {
						return subroute.subroutes.some((nested) => path_matches(nested.path, current_path));
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
			if (path_matches(subroute.path, current_path)) return true;

			// Check if current path is in nested subroutes
			if (subroute.subroutes) {
				return subroute.subroutes.some((nested) => path_matches(nested.path, current_path));
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

<nav class="admin-nav" aria-label="Admin navigation">
	<div class="admin-menu">
		{#each links as link (link.path + 'admin-nav')}
			<a
				href={resolve(link.path)}
				class:active={active_parent === link}
				aria-current={page.url.pathname === link.path ? 'page' : undefined}>{link.text}</a
			>
		{/each}
	</div>

	{#if show_subnav}
		<div class="admin-submenu" aria-label={`${active_parent?.text} navigation`}>
			{#each active_subroutes as subroute (subroute.path + 'admin-subnav')}
				<a
					href={resolve(subroute.path)}
					class:active={active_subroute === subroute}
					aria-current={page.url.pathname === subroute.path ? 'page' : undefined}>{subroute.text}</a
				>
			{/each}
		</div>
	{/if}

	{#if show_nested_subnav}
		<div class="admin-nested-submenu" aria-label={`${active_subroute?.text} navigation`}>
			{#each active_nested_subroutes as nested (nested.path + 'admin-nested-subnav')}
				<a
					href={resolve(nested.path)}
					class:active={path_matches(nested.path, page.url.pathname)}
					aria-current={page.url.pathname === nested.path ? 'page' : undefined}>{nested.text}</a
				>
			{/each}
		</div>
	{/if}
</nav>

<style>
	.admin-nav {
		position: relative;
		z-index: 2;
		color: var(--c-fg);
		background-color: var(--c-bg);
		border-bottom: 1px solid var(--c-fg-2);
	}

	.admin-menu,
	.admin-submenu,
	.admin-nested-submenu {
		display: flex;
		overflow-x: auto;
		gap: var(--pad-medium);
		padding: var(--pad-small) var(--pad-medium);
		flex-wrap: nowrap;
		scrollbar-width: thin;

		a {
			white-space: nowrap;
			font-size: var(--fs-2);
			color: var(--c-fg-7);
			text-underline-offset: var(--pad-xsmall);

			&:hover,
			&:focus-visible,
			&.active {
				color: var(--c-fg);
				text-decoration: underline;
				text-decoration-color: var(--c-primary);
			}

			&:focus-visible {
				outline: 2px solid var(--c-primary);
				outline-offset: 2px;
			}
		}
	}

	.admin-submenu,
	.admin-nested-submenu {
		padding-block: var(--pad-xsmall);
		background-color: var(--c-fg-05);
		border-top: 1px solid var(--c-fg-1);
	}

	.admin-nested-submenu {
		padding-inline-start: var(--pad-xlarge);
	}
</style>
