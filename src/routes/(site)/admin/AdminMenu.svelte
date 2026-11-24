<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Path } from '$app/types';

	type NavLink = { text: string; path: Path; subroutes?: NavLink[] };

	const links: NavLink[] = [
		{ text: 'Dashboard', path: '/admin' },
		{ text: 'Submissions', path: '/admin/submissions' },
		{
			text: 'Content',
			path: '/admin/content',
			subroutes: [
				// Transcripts is a tab in the Podcast page header, so the menu stays two rows at most
				{
					text: 'Podcast',
					path: '/admin/content/podcast'
				},
				{
					text: 'Video',
					path: '/admin/content/videos'
				},
				{
					text: 'Articles',
					path: '/admin/content/articles'
				}
			]
		},
		{ text: 'Tags', path: '/admin/tags' },
		{ text: 'Guests', path: '/admin/guests' },
		{ text: 'SEO', path: '/admin/seo' },
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

	function path_matches(link_path: Path, current_path: string): boolean {
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

			return link.subroutes?.some((subroute) => path_matches(subroute.path, current_path)) ?? false;
		});
	});

	// Derive the active second level subroute
	let active_subroute = $derived.by(() => {
		const current_path = page.url.pathname;

		if (!active_parent?.subroutes) return null;

		return active_parent.subroutes.find((subroute) => path_matches(subroute.path, current_path));
	});

	// Derive whether to show subnav and what subroutes to show
	let active_subroutes = $derived(active_parent?.subroutes ?? []);
	let show_subnav = $derived(active_subroutes.length > 0);

	// The menu is pinned to the top, one or two rows tall: --admin-nav-height (variables.css)
	// tells whatever else sticks to the top of the page where to stop
	function publish_height(nav: HTMLElement) {
		const root = document.documentElement;
		const observer = new ResizeObserver(() => {
			root.style.setProperty('--admin-nav-height', `${nav.offsetHeight}px`);
		});
		observer.observe(nav);
		return () => {
			observer.disconnect();
			root.style.removeProperty('--admin-nav-height');
		};
	}
</script>

<nav class="admin-nav" aria-label="Admin navigation" {@attach publish_height}>
	<div class="admin-menu">
		{#each links as link (link.path + 'admin-nav')}
			<a
				href={resolve(link.path)}
				class:active={active_parent === link}
				aria-current={page.url.pathname === link.path ? 'page' : undefined}>{link.text}</a
			>
		{/each}
		<!-- Loaded on its own: this menu is in every visitor's bundle, the reporter only in admins' -->
		{#await import('#lib/issue_reports/IssueReporter.svelte') then { default: IssueReporter }}
			<IssueReporter />
		{/await}
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
</nav>

<style>
	/*
		Pinned to the top, so the admin links and Report stay in reach however far down the page is
		scrolled. Above the site header (10), which scrolls under it, and its full-screen phone menu.
	*/
	.admin-nav {
		position: sticky;
		inset-block-start: 0;
		z-index: 20;
		color: var(--c-fg);
		background-color: var(--c-bg);
		border-bottom: 1px solid var(--c-fg-2);
	}

	.admin-menu,
	.admin-submenu {
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

	/* The page keeps this much room for the menu before it renders (admin.css). The rest is the border. */
	.admin-menu {
		min-block-size: calc(var(--admin-menu-height) - 1px);
	}

	.admin-submenu {
		padding-block: var(--pad-xsmall);
		background-color: var(--c-fg-05);
		border-top: 1px solid var(--c-fg-1);
	}
</style>
