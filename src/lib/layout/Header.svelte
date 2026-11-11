<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Logo from '#lib/layout/Logo.svelte';
	import Nav from '#lib/layout/Nav.svelte';

	interface Props {
		page_type?: 'landing' | 'interior';
	}

	let { page_type = 'interior' }: Props = $props();
	const is_admin_route = $derived(
		page.url.pathname === '/admin' || page.url.pathname.startsWith('/admin/')
	);
	// Home's hero (HomeHero.svelte) runs up behind the header and carries its own big logo
	const has_home_hero = $derived(
		page.url.pathname === '/' && Boolean(page.data.hero_video || page.data.debug_live_stream)
	);
</script>

{#if !is_admin_route}
	<header class={{ 'has-home-hero': has_home_hero }}>
		<div class={['layout-main', { 'has-home-hero': has_home_hero }]}>
			{#if page_type === 'interior'}
				{#if !has_home_hero}
					<a title="Syntax Podcast Home" href={resolve('')}>
						<Logo height="95px" />
					</a>
				{/if}
			{:else}
				<Logo height="185px" --logo-color="var(--c-primary)" />
			{/if}
			<Nav />
		</div>
	</header>
{/if}

<style>
	header {
		position: relative;
		z-index: 10;
		padding: 1.5rem 0;
	}

	header.has-home-hero {
		box-sizing: border-box;
		height: 165px;
		padding: 24px 0 48px;
	}

	.layout-main {
		display: flex;
		align-items: center;
		justify-content: space-between;

		--logo-color: light-dark(var(--c-black), var(--c-primary));
	}

	.layout-main.has-home-hero {
		justify-content: flex-end;

		--c-fg: var(--c-white);
	}

	@media (width < 700px) {
		header.has-home-hero {
			height: 323px;
			padding: 24px 0 0;
		}

		.layout-main.has-home-hero {
			justify-content: center;
		}
	}
</style>
