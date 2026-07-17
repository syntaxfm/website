<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Logo from '$lib/layout/Logo.svelte';
	import Nav from '$lib/layout/Nav.svelte';

	interface Props {
		page_type?: 'landing' | 'interior';
	}

	let { page_type = 'interior' }: Props = $props();
	const is_admin_route = $derived(
		page.url.pathname === '/admin' || page.url.pathname.startsWith('/admin/')
	);
	const is_homepage_live = $derived(
		page.url.pathname === '/' && Boolean(page.data.live_stream || page.data.debug_live_stream)
	);
</script>

{#if !is_admin_route}
	<header class={{ 'live-home': is_homepage_live }}>
		<div class={['layout-main', { 'live-home': is_homepage_live }]}>
			{#if page_type === 'interior'}
				{#if !is_homepage_live}
					<a title="Syntax Podcast Home" href={resolve('/')}>
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

	header.live-home {
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

	.layout-main.live-home {
		justify-content: flex-end;

		--c-fg: var(--c-white);
	}

	@media (width < 700px) {
		header.live-home {
			height: 323px;
			padding: 24px 0 0;
		}

		.layout-main.live-home {
			justify-content: center;
		}
	}
</style>
