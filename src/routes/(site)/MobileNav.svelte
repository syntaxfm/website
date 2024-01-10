<script lang="ts">
	import white_grit from '$assets/whitegrit.png';
	import { fly } from 'svelte/transition';
	let is_active = false;

	function toggle() {
		return (is_active = !is_active);
	}
</script>

<div class="mobile_nav">
	<button class="button-reset" on:click={toggle}>Menu</button>
	{#if is_active}
		<div
			transition:fly={{ opacity: 0, x: '100%' }}
			id="menu"
			class="menu"
			style="background-image:  url({white_grit}); background-size: 300px;"
		>
			<button class="button-reset close-button" on:click={toggle}>×</button>
			<nav>
				<a on:click={toggle} href="/shows">Shows</a>
				<a on:click={toggle} href="/snackpack">Newsletter</a>
				<a on:click={toggle} href="/about">About</a>
				<a on:click={toggle} href="/potluck">Potluck Qs</a>
				<a on:click={toggle} target="_blank" href="https://sentry.shop">Swag</a>
			</nav>
		</div>
	{/if}
</div>

<style lang="postcss">
	.mobile_nav {
		@media (--above_med) {
			display: none;
		}
	}

	nav a {
		text-decoration: none;
		color: var(--fg);
		text-decoration: none;
		border-bottom: solid 3px transparent;
		display: block;
		transition: border-color 0.2s ease;
		&:hover {
			border-bottom: solid 3px var(--primary);
		}
	}

	.button-reset {
		color: var(--white);
		text-transform: uppercase;
		font-weight: 900;
		letter-spacing: 1px;
	}

	.menu {
		position: fixed;
		inset: 0;
		color: var(--white);
		background-color: var(--black);
		width: 100vw;
		height: 100vh;
		justify-content: space-between;
		flex-direction: column;
		z-index: 11;
		display: flex;
		padding: 2rem;

		nav {
			margin-top: 30vh;
			font-size: var(--font-size-xxl);
			a {
				display: block;
				margin-bottom: 2rem;
				font-weight: 700;
				text-shadow: 0 0 4px black;
			}
		}
		> *:last-child {
			margin: 20px;
		}
	}

	.close-button {
		font-size: 4rem;
		margin: 0;
		position: absolute;
		top: 20px;
		right: 20px;
		display: block;
		line-height: 0.5;
		padding: 0;
	}
</style>
