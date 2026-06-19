<script>
	import { search } from '$state/search.svelte';
	import Icon from '../Icon.svelte';

	const LINKS = [
		['/shows', 'Shows'],
		['/about', 'About'],
		['/snackpack', 'Newsletter'],
		['/potluck', 'Potluck Qs'],
		['https://sentry.shop/collections/syntax', 'Shop']
	];

	let isOpen = $state(false);

	function setOpen(next) {
		isOpen = next;
		// Lock background scroll while the takeover covers the page.
		if (typeof document !== 'undefined') {
			document.body.style.overflow = next ? 'hidden' : '';
		}
	}

	function toggle() {
		setOpen(!isOpen);
	}

	function close() {
		setOpen(false);
	}

	function openSearch() {
		search.searching = true;
		close();
	}

	function handleKeydown(event) {
		if (event.key === 'Escape') close();
	}

	function handleResize() {
		if (isOpen && window.innerWidth >= 900) close();
	}
</script>

<svelte:window onkeydown={handleKeydown} onresize={handleResize} />

<nav>
	<button
		class="nav-toggle"
		aria-label="Menu"
		aria-expanded={isOpen}
		aria-controls="primary-nav"
		onclick={toggle}
	>
		{#if isOpen}
			<Icon name="close" />
		{:else}
			<svg
				width="18"
				height="18"
				viewBox="0 0 18 18"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				aria-hidden="true"
			>
				<line x1="2" y1="5" x2="16" y2="5" />
				<line x1="2" y1="9" x2="16" y2="9" />
				<line x1="2" y1="13" x2="16" y2="13" />
			</svg>
		{/if}
	</button>

	<ul id="primary-nav" class:open={isOpen}>
		{#each LINKS as [href, text] (href)}
			<li>
				<a {href} onclick={close}>{text}</a>
			</li>
		{/each}
		<li>
			<button onclick={openSearch}><Icon name="search" />Search</button>
		</li>
	</ul>
</nav>

<style>
	nav {
		position: relative;
	}

	.nav-toggle {
		display: none;
		position: relative;
		z-index: 60;
		align-items: center;
		justify-content: center;
		padding: 10px 12px;
		color: var(--c-fg);
		background: var(--c-fg-1);
		border-radius: var(--br-huge);
		transition: background 0.2s ease-in-out;

		&:hover {
			background: var(--c-fg-05);
		}
	}

	nav ul {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 1rem;
		padding: 0;

		& li {
			list-style: none;

			& a,
			button {
				font-size: var(--fs-2);
				display: flex;
				flex-wrap: nowrap;
				align-items: center;
				gap: 10px;
				white-space: nowrap;
				text-decoration: none;
				background: var(--c-fg-1);
				padding: 10px 18px 8px;
				border-radius: var(--br-huge);
				color: var(--c-fg);
				transition: background 0.2s ease-in-out;

				&:hover {
					background: var(--c-fg-05);
				}
			}
		}
	}

	/* Tighten the inline row before it collapses, so 900–1200 never feels cramped.
	   Literal ranges mirror the `--below-*` tokens (custom-media isn't resolved in
	   Svelte scoped styles, only in global CSS). */
	@media (width < 1200px) {
		nav ul {
			gap: 0.5rem;

			& li a,
			& li button {
				padding-inline: 14px;
			}
		}
	}

	@media (width < 900px) {
		.nav-toggle {
			display: inline-flex;
		}

		/* Fullscreen takeover, parked above the viewport so it never adds scroll. */
		nav ul {
			position: fixed;
			inset: 0;
			z-index: 50;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			gap: 1.25rem;
			padding: 2rem;
			background: var(--c-bg);
			transform: translateY(-100%);
			visibility: hidden;
			transition:
				transform 0.35s ease,
				visibility 0s linear 0.35s;

			& li {
				width: 100%;
				max-width: 320px;
			}

			& li a,
			& li button {
				width: 100%;
				justify-content: center;
				font-size: var(--fs-4);
				padding: 14px 20px;
			}
		}

		nav ul.open {
			transform: translateY(0);
			visibility: visible;
			transition:
				transform 0.35s ease,
				visibility 0s;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		nav ul,
		nav ul.open {
			transition: none;
		}
	}
</style>
