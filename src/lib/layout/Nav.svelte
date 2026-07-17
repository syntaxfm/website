<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { resolve } from '$app/paths';
	import { search } from '$state/search.svelte';
	import Icon from '../Icon.svelte';

	const component_id = $props.id();
	const nav_id = `${component_id}-primary-nav`;
	let is_open = $state(false);
	let nav_element: HTMLElement | undefined;
	let menu_element: HTMLUListElement | undefined;
	let toggle_element: HTMLButtonElement | undefined;
	let previous_body_overflow: string | null = null;
	let focus_frame: number | undefined;
	const background_inert_values: Array<[HTMLElement, boolean]> = [];
	const attach_nav: Attachment<HTMLElement> = (element) => {
		nav_element = element;
		return () => {
			if (nav_element === element) nav_element = undefined;
		};
	};
	const attach_menu: Attachment<HTMLUListElement> = (element) => {
		menu_element = element;
		return () => {
			if (menu_element === element) menu_element = undefined;
		};
	};
	const attach_toggle: Attachment<HTMLButtonElement> = (element) => {
		toggle_element = element;
		return () => {
			if (toggle_element === element) toggle_element = undefined;
		};
	};

	function schedule_focus(get_element: () => HTMLElement | null | undefined): void {
		if (focus_frame !== undefined) window.cancelAnimationFrame(focus_frame);
		focus_frame = window.requestAnimationFrame(() => {
			focus_frame = undefined;
			get_element()?.focus();
		});
	}

	function set_element_inert(element: HTMLElement): void {
		if (!background_inert_values.some(([inert_element]) => inert_element === element)) {
			background_inert_values.push([element, element.inert]);
		}
		element.inert = true;
	}

	function set_background_inert(): void {
		const header = nav_element?.closest('header');
		if (!header) return;

		const header_parent = header.parentElement;
		if (!header_parent) return;

		for (const sibling of header_parent.children) {
			if (sibling !== header && sibling instanceof HTMLElement) set_element_inert(sibling);
		}

		const app_parent = header_parent.parentElement;
		if (!app_parent) return;
		for (const sibling of app_parent.children) {
			if (sibling !== header_parent && sibling instanceof HTMLElement) set_element_inert(sibling);
		}
	}

	function restore_background_inert(): void {
		for (const [element, was_inert] of background_inert_values) {
			element.inert = was_inert;
		}
		background_inert_values.length = 0;
	}

	function set_open(next: boolean, should_restore_focus = false): void {
		if (next === is_open) {
			if (!next) restore_background_inert();
			return;
		}
		is_open = next;
		if (typeof document === 'undefined') return;

		if (next) {
			previous_body_overflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			set_background_inert();
			schedule_focus(() => menu_element?.querySelector<HTMLAnchorElement>('a'));
		} else if (previous_body_overflow !== null) {
			document.body.style.overflow = previous_body_overflow;
			previous_body_overflow = null;
		}

		if (!next) restore_background_inert();
		if (!next && should_restore_focus) schedule_focus(() => toggle_element);
	}

	function toggle(): void {
		set_open(!is_open, is_open);
	}

	function close(): void {
		set_open(false);
	}

	function open_search(): void {
		search.searching = true;
		close();
	}

	function handle_keydown(event: KeyboardEvent): void {
		if (!is_open) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			set_open(false, true);
			return;
		}

		if (event.key !== 'Tab' || !nav_element) return;
		const focusable_elements = Array.from(
			nav_element.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
		);
		const first_element = focusable_elements.at(0);
		const last_element = focusable_elements.at(-1);
		if (!first_element || !last_element) return;

		if (event.shiftKey && document.activeElement === first_element) {
			event.preventDefault();
			last_element.focus();
		} else if (!event.shiftKey && document.activeElement === last_element) {
			event.preventDefault();
			first_element.focus();
		}
	}

	function handle_resize(): void {
		if (is_open && window.innerWidth >= 900) close();
	}

	onDestroy(() => {
		if (focus_frame !== undefined) window.cancelAnimationFrame(focus_frame);
		close();
		restore_background_inert();
	});
</script>

<svelte:window onkeydown={handle_keydown} onresize={handle_resize} />

<nav {@attach attach_nav} aria-label="Primary navigation">
	<ul {@attach attach_menu} id={nav_id} class:open={is_open}>
		<li><a href={resolve('/shows')} onclick={close}>Shows</a></li>
		<li><a href={resolve('/about')} onclick={close}>About</a></li>
		<li><a href={resolve('/snackpack')} onclick={close}>Newsletter</a></li>
		<li><a href={resolve('/potluck')} onclick={close}>Potluck Qs</a></li>
		<li>
			<a href="https://sentry.shop/collections/syntax" rel="external" onclick={close}>Shop</a>
		</li>
	</ul>

	<div class="nav-actions">
		<button type="button" class="search-control" aria-label="Search" onclick={open_search}>
			<Icon name="search" />
			<span>Search</span>
		</button>
		<button
			{@attach attach_toggle}
			type="button"
			class="nav-toggle"
			aria-label={is_open ? 'Close menu' : 'Menu'}
			aria-expanded={is_open}
			aria-controls={nav_id}
			onclick={toggle}
		>
			<Icon name={is_open ? 'close' : 'list'} />
			<span>{is_open ? 'Close' : 'Menu'}</span>
		</button>
	</div>
</nav>

<style lang="postcss">
	nav {
		position: relative;
		display: flex;
		align-items: center;
		gap: 1rem;

		--mobile-menu-font-size: 16px;
	}

	.nav-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.nav-toggle,
	.search-control {
		position: relative;
		z-index: 60;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 10px 12px;
		color: var(--c-fg);
		background: var(--c-fg-1);
		border-radius: var(--br-huge);
		transition: background 0.2s ease-in-out;

		&:hover {
			background: var(--c-fg-05);
		}

		&:focus-visible {
			outline: var(--b-light);
			outline-color: var(--c-primary);
			outline-offset: var(--pad-xsmall);
		}
	}

	.nav-toggle {
		display: none;
	}

	.search-control {
		display: inline-flex;
		padding: 10px 18px 8px;
		font-size: var(--fs-2);
	}

	nav ul {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 1rem;
		margin: 0;
		padding: 0;

		& li {
			list-style: none;

			& a {
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

	/* Tighten the inline row before it collapses, so 900–1200 never feels cramped. */
	@media (--below-xlarge) {
		nav ul {
			gap: 0.5rem;

			& li a {
				padding-inline: 14px;
			}
		}

		.nav-actions {
			gap: 0.5rem;
		}
	}

	@media (--below-large) {
		nav {
			gap: 16px;
		}

		.nav-actions {
			gap: 16px;
		}

		.nav-toggle {
			display: inline-flex;
			padding: 8px 16px;
			font-size: var(--mobile-menu-font-size);
		}

		.search-control {
			padding: 8px;
		}

		.search-control span {
			display: none;
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

			& li a {
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
